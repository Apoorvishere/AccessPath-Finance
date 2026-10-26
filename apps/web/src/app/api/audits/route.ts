import { auditApprovedPages, validateAuditUrls } from "@/lib/audit-server";
import { getPreviewConfig, isAuthorized } from "@/lib/journey-server";

// A private, bounded preview. This module lock protects one local process only.
let activeAudit = false;

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function readSmallJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 8192) throw new Error("Body too large.");
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
  if (process.env.NODE_ENV !== "development") return json({ error: "The audit preview is available locally only." }, 503);
  if (process.env.ACCESSPATH_AUDIT_ENABLED !== "true") return json({ error: "The private audit preview is disabled." }, 503);
  const config = getPreviewConfig();
  if (!config) return json({ error: "The private preview is not configured." }, 503);
  if (!isAuthorized(request, config)) return json({ error: "Invalid preview access code." }, 401);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "Send JSON." }, 415);
  let body: unknown;
  try { body = await readSmallJson(request); }
  catch { return json({ error: "Send valid JSON under 8 KB." }, 400); }
  const urls = body && typeof body === "object" && !Array.isArray(body)
    ? validateAuditUrls((body as Record<string, unknown>).urls, config.allowedHosts)
    : null;
  if (!urls) return json({ error: "Choose up to three distinct pages from the approved Northstar demo site." }, 400);
  if (activeAudit) return json({ error: "An audit is already running in this preview. Try again shortly." }, 429);

  activeAudit = true;
  try {
    const report = await auditApprovedPages(urls, config.apiKey, config.allowedHosts);
    return json(report, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The audit stopped for an unknown reason.";
    process.stderr.write(`Private audit failed: ${message}\n`);
    return json({ error: `${message} Check the TinyFish dashboard before trying again.` }, 502);
  } finally {
    activeAudit = false;
  }
}
