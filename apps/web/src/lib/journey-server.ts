import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import type { JourneyResult, JourneyRun, JourneyStep } from "./journey-types";

const TINYFISH_BASE = "https://agent.tinyfish.ai/v1";

type PreviewConfig = {
  apiKey: string;
  demoCode: string;
  allowedHosts: Set<string>;
};

export function getPreviewConfig(): PreviewConfig | null {
  const apiKey = process.env.TINYFISH_API_KEY?.trim();
  const demoCode = process.env.ACCESSPATH_DEMO_CODE?.trim();
  const allowedHosts = new Set(
    (process.env.ACCESSPATH_ALLOWED_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );

  if (!apiKey || !demoCode || demoCode.length < 16 || allowedHosts.size === 0) {
    return null;
  }
  return { apiKey, demoCode, allowedHosts };
}

export function isAuthorized(request: Request, config: PreviewConfig): boolean {
  const supplied = request.headers.get("x-accesspath-demo-code") ?? "";
  const expectedHash = createHash("sha256").update(config.demoCode).digest();
  const suppliedHash = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(expectedHash, suppliedHash);
}

export function validateTarget(value: unknown, config: PreviewConfig): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      url.port !== "" ||
      url.username ||
      url.password ||
      host === "localhost" ||
      isIP(host) !== 0 ||
      !config.allowedHosts.has(host)
    ) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function validateGoal(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const goal = value.trim().replace(/\s+/g, " ");
  if (goal.length < 12 || goal.length > 180 || /[\u0000-\u001f\u007f]/.test(goal)) return null;
  return goal;
}

const outputSchema = {
  type: "object",
  properties: {
    outcome: { type: "string", enum: ["completed", "not_found", "blocked"] },
    summary: { type: "string" },
    steps: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          url: { type: "string" },
          action: { type: "string" },
          observation: { type: "string" },
        },
        required: ["title", "url", "action", "observation"],
      },
    },
  },
  required: ["outcome", "summary", "steps"],
};

export async function startTinyFishRun(url: string, visitorGoal: string, apiKey: string): Promise<string> {
  const startingHost = new URL(url).hostname;
  const response = await fetch(`${TINYFISH_BASE}/automation/run-async`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify({
      url,
      goal: [
        `Visitor goal: ${visitorGoal}`,
        "Follow the public website to accomplish this goal and record the actual pages visited in order.",
        `Stay on the exact hostname ${startingHost}. Do not click or follow links to another hostname.`,
        "Visit at most six pages. Do not log in, submit forms, purchase, or change data.",
        "If the goal cannot be reached safely, stop and report not_found or blocked.",
        "For each visited page, return its title, exact URL, action taken, and a brief factual observation.",
        "Do not invent pages or accessibility findings. This stage discovers the route only.",
      ].join("\n"),
      output_schema: outputSchema,
      agent_config: { max_duration_seconds: 90 },
    }),
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`TinyFish could not start this run (${response.status}).`);
  const data: unknown = await response.json();
  if (!isRecord(data) || typeof data.run_id !== "string" || !/^[A-Za-z0-9_-]{8,100}$/.test(data.run_id)) {
    throw new Error("TinyFish returned an invalid run identifier.");
  }
  return data.run_id;
}

export async function getTinyFishRun(runId: string, apiKey: string, allowedHosts: Set<string>): Promise<JourneyRun> {
  const response = await fetch(`${TINYFISH_BASE}/runs/${encodeURIComponent(runId)}`, {
    headers: { "X-API-Key": apiKey },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`TinyFish could not retrieve this run (${response.status}).`);

  const data: unknown = await response.json();
  if (!isRecord(data) || !isStatus(data.status)) throw new Error("TinyFish returned an invalid run state.");
  const result = data.status === "COMPLETED" ? parseResult(data.result, allowedHosts) : null;
  return {
    status: data.status,
    result,
    error: data.status === "FAILED" || data.status === "CANCELLED"
      ? getErrorMessage(data.error)
      : data.status === "COMPLETED" && !result
        ? "TinyFish completed the run but did not return a valid journey."
        : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStatus(value: unknown): value is JourneyRun["status"] {
  return value === "PENDING" || value === "RUNNING" || value === "COMPLETED" || value === "FAILED" || value === "CANCELLED";
}

function parseResult(value: unknown, allowedHosts: Set<string>): JourneyResult | null {
  if (!isRecord(value)) return null;
  if (value.outcome !== "completed" && value.outcome !== "not_found" && value.outcome !== "blocked") return null;
  if (typeof value.summary !== "string" || !Array.isArray(value.steps)) return null;
  const steps: JourneyStep[] = [];
  let outOfScopeCount = 0;
  for (const step of value.steps.slice(0, 6)) {
    if (!isRecord(step) || typeof step.title !== "string" || typeof step.url !== "string" || typeof step.action !== "string" || typeof step.observation !== "string") return null;
    let inScope = false;
    try {
      const page = new URL(step.url);
      inScope = page.protocol === "https:" && page.port === "" && !page.username && !page.password && allowedHosts.has(page.hostname.toLowerCase());
    } catch { /* Invalid output URL is outside the approved scope. */ }
    if (!inScope) { outOfScopeCount += 1; continue; }
    steps.push({
      title: step.title.slice(0, 160),
      url: step.url.slice(0, 2048),
      action: step.action.slice(0, 300),
      observation: step.observation.slice(0, 500),
    });
  }
  return {
    outcome: steps.length === 0 && outOfScopeCount > 0 ? "blocked" : value.outcome,
    summary: value.summary.slice(0, 800),
    steps,
    ...(outOfScopeCount > 0 ? { scopeNote: `${outOfScopeCount} off-site ${outOfScopeCount === 1 ? "step was" : "steps were"} excluded from this approved-site journey.` } : {}),
  };
}

function getErrorMessage(value: unknown): string {
  if (isRecord(value) && typeof value.message === "string") return value.message.slice(0, 300);
  return "The journey could not be completed. Please try again.";
}
