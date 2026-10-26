import { createServerSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { validateImportedAudit } from "@/lib/validate-import";

const json = (body: unknown, status: number) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

async function readBounded(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 800_000) throw new Error("Report exceeds 800 KB");
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const buffer = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(buffer));
}

export async function POST(request: Request) {
  if (!supabaseConfigured()) return json({ error: "Workspace is not configured." }, 503);
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) return json({ error: "Invalid request origin." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "Send JSON." }, 415);
  const idempotencyKey = request.headers.get("idempotency-key");
  if (!idempotencyKey || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return json({ error: "A valid idempotency key is required." }, 400);
  }
  const supabase = await createServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return json({ error: "Sign in to save this report." }, 401);
  let body: unknown;
  try { body = await readBounded(request); }
  catch { return json({ error: "Send a valid audit JSON under 800 KB." }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid report request." }, 400);
  const input = body as Record<string, unknown>;
  const report = validateImportedAudit(input.report);
  const task = typeof input.task === "string" ? input.task.trim().replace(/\s+/g, " ") : "";
  if (!report || task.length < 12 || task.length > 180) return json({ error: "Use a valid controlled-demo audit and a short task." }, 400);
  const { data, error } = await supabase.rpc("save_imported_audit", {
    p_target_url: report.pages[0].url, p_task: task,
    p_report: report, p_idempotency_key: idempotencyKey,
  });
  if (error) {
    if (error.code === "P0001") return json({ error: "Daily saved-report limit reached. Try again tomorrow." }, 429);
    return json({ error: "Could not save this report." }, 500);
  }
  return json({ id: data }, 201);
}
