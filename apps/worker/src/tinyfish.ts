const API = "https://agent.tinyfish.ai/v1";
import { approvedPageUrl, targetForStart, type ScanTarget } from "./targets";

export type JourneyStep = { title: string; url: string; action: string; observation: string };
export type Journey = { outcome: "completed" | "not_found" | "blocked"; summary: string; steps: JourneyStep[] };

const outputSchema = {
  type: "object",
  properties: {
    outcome: { type: "string", enum: ["completed", "not_found", "blocked"] },
    summary: { type: "string" },
    steps: {
      type: "array", maxItems: 6,
      items: {
        type: "object",
        properties: { title: { type: "string" }, url: { type: "string" }, action: { type: "string" }, observation: { type: "string" } },
        required: ["title", "url", "action", "observation"],
      },
    },
  },
  required: ["outcome", "summary", "steps"],
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseJourney(value: unknown, target: ScanTarget): Journey | null {
  if (!record(value) || !["completed", "not_found", "blocked"].includes(String(value.outcome)) ||
      typeof value.summary !== "string" || !Array.isArray(value.steps) || value.steps.length > 6) return null;
  const steps: JourneyStep[] = [];
  for (const item of value.steps) {
    if (!record(item) || typeof item.title !== "string" || typeof item.action !== "string" || typeof item.observation !== "string") return null;
    const url = approvedPageUrl(item.url, target);
    if (!url) return null;
    steps.push({ title: item.title.slice(0, 160), url, action: item.action.slice(0, 300), observation: item.observation.slice(0, 500) });
  }
  return { outcome: value.outcome as Journey["outcome"], summary: value.summary.slice(0, 800), steps };
}

export async function discoverDemoJourney(targetUrl: string, task: string, apiKey: string): Promise<Journey> {
  const target = targetForStart(targetUrl);
  if (!target) throw new Error("Invalid approved target");
  const start = await fetch(`${API}/automation/run-async`, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(30_000),
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify({
      url: targetUrl,
      goal: [
        `Visitor goal: ${task}`,
        `Follow the public ${target.label} and record pages actually visited in order.`,
        `${target.instruction} Visit at most three pages.`,
        "Do not log in, submit forms, purchase, or change any data.",
        "If the goal cannot be completed within this public area, return not_found or blocked.",
        "Return each page's title, URL, action and a factual observation. Do not invent findings.",
      ].join("\n"),
      output_schema: outputSchema,
      agent_config: { max_duration_seconds: 90 },
    }),
  });
  if (!start.ok) throw new Error(`Agent start HTTP ${start.status}`);
  const started: unknown = await start.json();
  if (!record(started) || typeof started.run_id !== "string" || !/^[A-Za-z0-9_-]{8,100}$/.test(started.run_id)) throw new Error("Invalid agent run ID");

  // A run can finish after its requested agent duration because startup and
  // result finalization add latency. Allow four minutes for polling while
  // keeping the provider's own max_duration_seconds at 90.
  for (let attempt = 0; attempt < 80; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const response = await fetch(`${API}/runs/${encodeURIComponent(started.run_id)}`, {
      headers: { "X-API-Key": apiKey }, cache: "no-store", signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Agent poll HTTP ${response.status}`);
    const data: unknown = await response.json();
    if (!record(data) || typeof data.status !== "string") throw new Error("Invalid agent state");
    if (data.status === "FAILED" || data.status === "CANCELLED") throw new Error("Agent run did not complete");
    if (data.status === "COMPLETED") {
      const journey = parseJourney(data.result, target);
      if (!journey) throw new Error("Agent returned an invalid controlled journey");
      return journey;
    }
    if (data.status !== "PENDING" && data.status !== "RUNNING") throw new Error("Unknown agent state");
  }
  throw new Error("Agent run exceeded the polling window");
}
export function repeatedJourneyStep(
  journey: Journey
): { first: number; repeated: number } | null {
  const seen = new Map<string, number>();

  for (const [index, step] of journey.steps.entries()) {
    const action = step.action.trim().toLowerCase().replace(/\s+/g, " ");
    const key = `${step.url}\n${action}`;
    const first = seen.get(key);

    if (first !== undefined) {
      return { first, repeated: index };
    }

    seen.set(key, index);
  }

  return null;
}

export function auditUrlsFromJourney(journey: Journey): string[] {
  if (journey.outcome !== "completed") return [];
  return [...new Set(journey.steps.map(step => step.url))].slice(0, 3);
}
