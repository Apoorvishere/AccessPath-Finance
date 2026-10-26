import { access } from "node:fs/promises";
import { createRequire } from "node:module";
import { chromium, type Browser } from "playwright-core";
import type { AuditPage, AuditResult, AuditViolation } from "./audit-types";
import { approvedPageUrl, targetForStart, type ScanTarget } from "./targets";

const BROWSER_API = "https://api.browser.tinyfish.ai";
const MAX_PAGES = 3;
const MAX_SCREENSHOT_BYTES = 500_000; // 500 KB before JSON encoding.

const AXE_SCRIPT = createRequire(import.meta.url).resolve("axe-core/axe.min.js");

type BrowserSession = { session_id: string; cdp_url: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeFailureDetail(error: unknown): string {
  if (!(error instanceof Error)) return "Unknown browser error";
  return error.message
    .split(/\r?\n/).slice(0, 2).join(" | ")
    .replace(/(?:https?|wss?):\/\/\S+/gi, "[url]")
    .replace(/[A-Za-z0-9_-]{40,}/g, "[redacted]")
    .slice(0, 220);
}

export function validateAuditUrls(value: unknown, target: ScanTarget): string[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_PAGES) return null;
  const urls = value.map((item) => approvedPageUrl(item, target));
  if (urls.some((item) => item === null)) return null;
  const unique = [...new Set(urls as string[])];
  return unique.length === urls.length ? unique : null;
}

async function createSession(key: string, firstUrl: string): Promise<BrowserSession> {
  const response = await fetch(BROWSER_API, {
    method: "POST",
    headers: { "X-API-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ url: firstUrl, timeout_seconds: 180 }),
    signal: AbortSignal.timeout(65_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Browser session could not start (HTTP ${response.status}).`);
  const data: unknown = await response.json();
  if (!isRecord(data) || typeof data.session_id !== "string" || typeof data.cdp_url !== "string") {
    throw new Error("Browser API returned an invalid session.");
  }
  return { session_id: data.session_id, cdp_url: data.cdp_url };
}

async function closeSession(key: string, sessionId: string): Promise<void> {
  const response = await fetch(`${BROWSER_API}/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: { "X-API-Key": key },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!response.ok) console.warn(`TinyFish Browser session cleanup returned HTTP ${response.status}.`);
}

function summarize(raw: unknown): Pick<AuditPage, "violations" | "needsReviewCount" | "passedRuleCount"> {
  if (!isRecord(raw) || !Array.isArray(raw.violations) || !Array.isArray(raw.incomplete) || !Array.isArray(raw.passes)) {
    throw new Error("axe-core returned an invalid result.");
  }
  const violations: AuditViolation[] = raw.violations.slice(0, 30).filter(isRecord).map((item) => {
    const nodes = Array.isArray(item.nodes) ? item.nodes.filter(isRecord) : [];
    return {
      id: String(item.id ?? "unknown").slice(0, 80),
      impact: typeof item.impact === "string" ? item.impact.slice(0, 30) : null,
      help: String(item.help ?? "Accessibility finding").slice(0, 180),
      helpUrl: typeof item.helpUrl === "string" ? item.helpUrl.slice(0, 500) : "",
      affectedCount: nodes.length,
      selectors: nodes.slice(0, 5).map((node) => Array.isArray(node.target) ? node.target.join(" ").slice(0, 180) : "").filter(Boolean),
    };
  });
  return { violations, needsReviewCount: raw.incomplete.length, passedRuleCount: raw.passes.length };
}

export async function auditApprovedPages(urls: string[], startUrl: string, key: string): Promise<AuditResult> {
  const targetPolicy = targetForStart(startUrl);
  const checkedUrls = targetPolicy && validateAuditUrls(urls, targetPolicy);
  if (!targetPolicy || !checkedUrls) throw new Error("Invalid approved audit route");
  let session: BrowserSession | undefined;
  let browser: Browser | undefined;
  let stage = "checking the installed axe-core browser file";
  try {
    // Check before creating a paid session. Reading this file avoids bundler-altered axe.source.
    await access(AXE_SCRIPT);
    stage = "starting the TinyFish Browser session";
    session = await createSession(key, checkedUrls[0]);
    stage = "connecting to the browser";
    browser = await chromium.connectOverCDP(session.cdp_url, { timeout: 30_000 });
    // TinyFish supplies an existing page. Opening a new context can close its session.
    const context = browser.contexts()[0];
    const page = context?.pages()[0];
    if (!context || !page) throw new Error("Browser session opened without a page.");
    stage = "allowing axe-core in the browser page";
    const cdp = await context.newCDPSession(page);
    await cdp.send("Page.setBypassCSP", { enabled: true });
    const pages: AuditPage[] = [];

    for (const [index, target] of checkedUrls.entries()) {
      stage = `loading approved page ${index + 1}`;
      const response = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30_000 });
      const finalUrl = approvedPageUrl(page.url(), targetPolicy);
      if (!response?.ok() || !finalUrl || finalUrl !== target) {
        throw new Error("An audited page did not load at its approved URL.");
      }
      stage = `injecting axe-core on approved page ${index + 1}`;
      await page.addScriptTag({ path: AXE_SCRIPT });
      stage = `running axe-core on approved page ${index + 1}`;
      const raw: unknown = await page.evaluate(async () => {
        const runtime = (globalThis as unknown as { axe?: { run: (document: Document, options: unknown) => Promise<unknown> } }).axe;
        if (!runtime) throw new Error("axe-core did not load.");
        return runtime.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
      });
      stage = `summarizing approved page ${index + 1}`;
      const findings = summarize(raw);
      stage = `mapping approved page ${index + 1}`;
      const pageDetails = await page.evaluate(() => ({
        description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? null,
        language: document.documentElement.lang || null,
        canonicalUrl: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
        robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null,
        headings: Array.from(document.querySelectorAll("h1, h2")).slice(0, 12).map(node => node.textContent?.trim() ?? ""),
        links: Array.from(document.querySelectorAll("a[href]")).slice(0, 100).map(node => ({
          url: (node as HTMLAnchorElement).href,
          label: node.textContent?.trim() ?? "",
        })),
      }));
      const linkSet = new Set<string>();
      const approvedLinks = pageDetails.links.flatMap(link => {
        const url = approvedPageUrl(link.url, targetPolicy);
        if (!url || linkSet.has(url)) return [];
        linkSet.add(url);
        return [{ url, label: link.label.slice(0, 100) }];
      }).slice(0, 12);
      let canonicalUrl: string | null = null;
      if (pageDetails.canonicalUrl) {
        try { canonicalUrl = approvedPageUrl(new URL(pageDetails.canonicalUrl, finalUrl).href, targetPolicy); }
        catch { /* A malformed canonical tag must not fail the audit. */ }
      }
      const metadata: AuditPage["metadata"] = {
        description: pageDetails.description?.slice(0, 300) ?? null,
        language: pageDetails.language?.slice(0, 40) ?? null,
        canonicalUrl,
        robots: pageDetails.robots?.slice(0, 100) ?? null,
        headings: pageDetails.headings.filter(Boolean).map(heading => heading.slice(0, 120)),
        approvedLinks,
      };
      stage = `capturing approved page ${index + 1}`;
      const bytes = await page.screenshot({ type: "jpeg", quality: 65, fullPage: false });
      pages.push({
        url: finalUrl,
        title: (await page.title()).slice(0, 180),
        metadata,
        ...findings,
        screenshot: bytes.length <= MAX_SCREENSHOT_BYTES ? `data:image/jpeg;base64,${bytes.toString("base64")}` : null,
      });
    }

    return {
      checkedAt: new Date().toISOString(),
      pages,
      note: "Automated WCAG-tagged axe-core checks in a TinyFish Browser session. Findings and rules needing review require human evaluation; this is not a conformance certificate.",
    };
  } catch (error) {
    // Keep provider URLs and error stacks out of user-facing responses and logs.
    process.stderr.write(`Audit failure detail (${stage}): ${safeFailureDetail(error)}\n`);
    if (error instanceof Error && /^Browser session could not start \(HTTP \d{3}\)\.$/.test(error.message)) {
      throw error;
    }
    throw new Error(`Audit stopped while ${stage}.`);
  } finally {
    await browser?.close().catch(() => {});
    if (session) await closeSession(key, session.session_id).catch(() => {
      console.warn("Could not confirm TinyFish Browser session cleanup. Check the dashboard.");
    });
  }
}
