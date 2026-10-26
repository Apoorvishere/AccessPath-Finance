import { createServerSupabase, supabaseConfigured } from "@/lib/supabase/server";
import { approvedScanTarget } from "@/lib/scan-targets";

const publicFailureCodes = new Set([
  "journey_blocked",
  "journey_loop",
  "goal_not_found",
  "journey_failed",
  "audit_failed",
  "saving_failed",
]);

const json = (body: unknown, status: number) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

export async function GET() {
  if (!supabaseConfigured()) {
    return json({ error: "Workspace is not configured." }, 503);
  }

  const supabase = await createServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims?.sub) {
    return json({ error: "Sign in to view your scans." }, 401);
  }

  const { data, error } = await supabase
    .from("scans")
    .select("id,source,target_url,task,status,failure_code,created_at,finished_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return json({ error: "Could not load your scans." }, 500);
  }

  const scans = (data ?? []).map(scan => ({
    ...scan,
    failure_code:
      typeof scan.failure_code === "string" &&
      publicFailureCodes.has(scan.failure_code)
        ? scan.failure_code
        : null,
  }));

  return json({ scans }, 200);
}

async function readSmallJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");

  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      size += value.length;
      if (size > 4096) throw new Error("Body too large");
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let position = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, position);
    position += chunk.length;
  }

  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function POST(request: Request) {
  // The app flag is only an operational switch. The database function owns
  // authorization and budget enforcement, even across multiple server instances.
  if (process.env.NEXT_PUBLIC_ACCESSPATH_LIVE_SCANS_ENABLED !== "true") {
    return json({ error: "Live scans are not enabled yet." }, 503);
  }

  if (!supabaseConfigured()) {
    return json({ error: "Workspace is not configured." }, 503);
  }

  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return json({ error: "Invalid request origin." }, 403);
  }

  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return json({ error: "Send JSON." }, 415);
  }

  const idempotencyKey = request.headers.get("idempotency-key");

  if (
    !idempotencyKey ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idempotencyKey
    )
  ) {
    return json({ error: "A valid idempotency key is required." }, 400);
  }

  const supabase = await createServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims?.sub) {
    return json({ error: "Sign in to start a scan." }, 401);
  }

  let body: unknown;

  try {
    body = await readSmallJson(request);
  } catch {
    return json({ error: "Send valid JSON under 4 KB." }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ error: "Invalid scan request." }, 400);
  }

  const input = body as Record<string, unknown>;
  const task =
    typeof input.task === "string"
      ? input.task.trim().replace(/\s+/g, " ")
      : "";
  const target = approvedScanTarget(input.targetUrl);

  if (
    !target ||
    task.length < 12 ||
    task.length > 180 ||
    /[\u0000-\u001f\u007f]/.test(task)
  ) {
    return json(
      {
        error:
          "Choose an approved public site and describe one short visitor goal.",
      },
      400
    );
  }

  const { data, error } = await supabase.rpc("enqueue_live_scan", {
    p_target_url: target.url,
    p_task: task,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    const known: Record<string, [string, number]> = {
      P0001: ["Your daily live-scan limit has been reached.", 429],
      P0002: ["Live scans are paused.", 503],
      P0003: ["You already have a scan in progress.", 409],
      P0004: ["Today's shared scan budget has been reached.", 429],
      P0005: ["The preview scan budget has been reached.", 429],
      P0006: ["Your account is not enabled for the live preview yet.", 403],
    };

    const [message, status] = known[error.code] ?? [
      "Could not queue this scan.",
      500,
    ];

    return json({ error: message }, status);
  }

  return json({ id: data, status: "queued" }, 202);
}