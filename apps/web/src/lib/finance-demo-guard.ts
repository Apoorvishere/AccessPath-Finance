type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const windowMs = 15 * 60 * 1000;

export function checkFinanceDemoRequest(request: Request, kind: "explain" | "extract"): Response | null {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
      }
    } catch { return Response.json({ error: "Invalid origin" }, { status: 403 }); }
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ error: "Cross-site request rejected" }, { status: 403 });
  }

  const now = Date.now();
  if (buckets.size > 1000) {
    for (const [id, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(id);
  }
  const address = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const id = `${kind}:${address}`;
  const current = buckets.get(id);
  const limit = kind === "extract" ? 8 : 40;
  if (current && current.resetAt > now && current.count >= limit) {
    return Response.json({ error: "Demo AI limit reached. Try again later." }, { status: 429, headers: { "Retry-After": String(Math.ceil((current.resetAt - now) / 1000)), "Cache-Control": "no-store" } });
  }
  if (!current || current.resetAt <= now) buckets.set(id, { count: 1, resetAt: now + windowMs });
  else current.count += 1;
  return null;
}
