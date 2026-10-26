import { createServerSupabase, supabaseConfigured } from "@/lib/supabase/server";

const json = (body: unknown, status: number) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!supabaseConfigured()) return json({ error: "Workspace is not configured." }, 503);
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return json({ error: "Invalid scan ID." }, 400);
  const supabase = await createServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return json({ error: "Sign in to view this scan." }, 401);
  const { data, error } = await supabase.from("scans")
    .select("id,source,target_url,task,status,failure_code,report,journey,created_at,finished_at")
    .eq("id", id).maybeSingle();
  if (error) return json({ error: "Could not load this scan." }, 500);
  if (!data) return json({ error: "Scan not found." }, 404);
  return json({ scan: { ...data, failure_code: data.failure_code === "journey_loop" ? "journey_loop" : null } }, 200);
}
