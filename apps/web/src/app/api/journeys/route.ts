import { getPreviewConfig, isAuthorized, startTinyFishRun, validateGoal, validateTarget } from "@/lib/journey-server";

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function readSmallJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request body.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 4096) throw new Error("Request is too large.");
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function POST(request: Request): Promise<Response> {
  const config = getPreviewConfig();
  if (!config) return json({ error: "The private preview is not configured yet." }, 503);
  if (!isAuthorized(request, config)) return json({ error: "Invalid preview access code." }, 401);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "Send a JSON request." }, 415);
  }

  let body: unknown;
  try { body = await readSmallJson(request); }
  catch { return json({ error: "The request must be valid JSON under 4 KB." }, 400); }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return json({ error: "Enter a website and a visitor goal." }, 400);
  }
  const record = body as Record<string, unknown>;
  const url = validateTarget(record.url, config);
  const goal = validateGoal(record.goal);
  if (!url) return json({ error: "Use an approved public HTTPS website URL." }, 400);
  if (!goal) return json({ error: "Describe the visitor goal in 12–180 characters." }, 400);

  try {
    const runId = await startTinyFishRun(url, goal, config.apiKey);
    return json({ runId }, 202);
  } catch (error) {
    console.error("TinyFish start failed", error);
    return json({ error: "TinyFish could not start the journey. Check the server log and API credits." }, 502);
  }
}
