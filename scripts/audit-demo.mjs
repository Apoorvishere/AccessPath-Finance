import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { chromium } from "playwright-core";
import axe from "axe-core";

const browserApi = "https://api.browser.tinyfish.ai";
const routes = [
  { id: "home", path: "/demo-site" },
  { id: "support", path: "/demo-site/support" },
  { id: "contact", path: "/demo-site/contact" },
  { id: "corrected-contact", path: "/demo-site/fixed/contact" },
];

function parseEnvValue(source, name) {
  const line = source.split(/\r?\n/).find((item) => item.trim().startsWith(`${name}=`));
  if (!line) return "";
  const value = line.slice(line.indexOf("=") + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

async function apiKey() {
  if (process.env.TINYFISH_API_KEY?.trim()) return process.env.TINYFISH_API_KEY.trim();
  const localEnv = await readFile(resolve("apps/web/.env.local"), "utf8");
  const key = parseEnvValue(localEnv, "TINYFISH_API_KEY");
  if (!key) throw new Error("TINYFISH_API_KEY is missing from apps/web/.env.local.");
  return key;
}

function deployedOrigin(input) {
  const url = new URL(input);
  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    throw new Error("Pass a public HTTPS deployment URL without credentials or a custom port.");
  }
  return url.origin;
}

async function createSession(key, url) {
  const response = await fetch(browserApi, {
    method: "POST",
    headers: { "X-API-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ url, timeout_seconds: 180 }),
    signal: AbortSignal.timeout(65_000),
  });
  if (!response.ok) throw new Error(`TinyFish Browser API could not create a session (HTTP ${response.status}).`);
  const session = await response.json();
  if (!session || typeof session.session_id !== "string" || typeof session.cdp_url !== "string") {
    throw new Error("TinyFish Browser API returned an invalid session.");
  }
  return session;
}

async function closeSession(key, sessionId) {
  const response = await fetch(`${browserApi}/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: { "X-API-Key": key },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) console.warn(`TinyFish session cleanup returned HTTP ${response.status}. Check the dashboard.`);
}

function summarize(results) {
  return {
    checkedUrl: results.url,
    violations: results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      helpUrl: violation.helpUrl,
      description: violation.description,
      affected: violation.nodes.slice(0, 20).map((node) => ({
        selector: node.target,
        html: node.html.slice(0, 500),
        failureSummary: node.failureSummary?.slice(0, 800) ?? null,
      })),
      affectedCount: violation.nodes.length,
    })),
    needsReviewCount: results.incomplete.length,
    passedRuleCount: results.passes.length,
  };
}

async function main() {
  if (process.argv.length !== 3) {
    throw new Error("Usage: node scripts/audit-demo.mjs https://your-deployment.vercel.app");
  }
  const origin = deployedOrigin(process.argv[2]);
  const key = await apiKey();
  const evidenceDir = resolve("docs/evidence");
  await mkdir(evidenceDir, { recursive: true });

  let session;
  let browser;
  try {
    console.log("Starting one TinyFish Browser API session for the controlled demo…");
    session = await createSession(key, `${origin}/demo-site`);
    browser = await chromium.connectOverCDP(session.cdp_url, { timeout: 30_000 });
    const context = browser.contexts()[0] ?? await browser.newContext();
    const page = context.pages()[0] ?? await context.newPage();
    const pages = [];

    for (const route of routes) {
      const target = `${origin}${route.path}`;
      const response = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30_000 });
      if (!response?.ok() || new URL(page.url()).origin !== origin) {
        throw new Error(`The ${route.id} page did not load from the approved origin.`);
      }
      await page.addScriptTag({ content: axe.source });
      const raw = await page.evaluate(async () => globalThis.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      }));
      await page.screenshot({ path: resolve(evidenceDir, `${route.id}.png`), fullPage: true });
      const summary = summarize(raw);
      pages.push({ id: route.id, ...summary });
      console.log(`${route.id}: ${summary.violations.length} rules with violations, ${summary.needsReviewCount} rules needing review`);
    }

    const report = {
      kind: "controlled-demo-accessibility-audit",
      origin,
      checkedAt: new Date().toISOString(),
      engine: "axe-core in a TinyFish Browser API session controlled by Playwright",
      note: "Automated findings require human review; this report does not certify WCAG conformance.",
      pages,
    };
    await writeFile(resolve(evidenceDir, "audit.json"), `${JSON.stringify(report, null, 2)}\n`);
    const original = pages.find((page) => page.id === "contact");
    const corrected = pages.find((page) => page.id === "corrected-contact");
    const originalLabel = original?.violations.some((violation) => violation.id === "label");
    const correctedLabel = corrected?.violations.some((violation) => violation.id === "label");
    console.log(`Fixture check: original label finding=${Boolean(originalLabel)}, corrected label finding=${Boolean(correctedLabel)}`);
    console.log("Saved docs/evidence/audit.json and four screenshots. Review the full report before making claims.");
    if (!originalLabel || correctedLabel) process.exitCode = 2;
  } finally {
    await browser?.close().catch(() => {});
    if (session) await closeSession(key, session.session_id).catch(() => {
      console.warn("Could not confirm session cleanup. Check the TinyFish dashboard.");
    });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Audit failed.");
  process.exitCode = 1;
});
