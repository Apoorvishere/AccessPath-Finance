import { getPreviewConfig, getTinyFishRun, isAuthorized } from "@/lib/journey-server";

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request, context: { params: Promise<{ runId: string }> }): Promise<Response> {
  const config = getPreviewConfig();
  if (!config) return json({ error: "The private preview is not configured yet." }, 503);
  if (!isAuthorized(request, config)) return json({ error: "Invalid preview access code." }, 401);
  const { runId } = await context.params;
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(runId)) return json({ error: "Invalid run identifier." }, 400);

  try {
    return json(await getTinyFishRun(runId, config.apiKey, config.allowedHosts), 200);
  } catch (error) {
    console.error("TinyFish status failed", error);
    return json({ error: "Could not refresh this journey. Try again shortly." }, 502);
  }
}
