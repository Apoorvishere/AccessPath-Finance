import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { checkFinanceDemoRequest } from "../../../../lib/finance-demo-guard";

const base = "https://api.sarvam.ai/doc-ai/v1/job";
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const schema = JSON.stringify({
  type: "object",
  properties: {
    full_name: { type: "string", description: "Full employee name printed on the payslip" },
    monthly_income: { type: "number", description: "Gross monthly income in INR, as a number without currency text" },
    employment_type: { type: "string", description: "Employment type printed on the payslip" },
    pay_period: { type: "string", description: "Month and year of the payslip" },
  },
});

function token(jobId: string, key: string): string {
  return createHmac("sha256", key).update(`sample-payslip:${jobId}`).digest("hex");
}

export async function POST(request: Request): Promise<Response> {
  const rejected = checkFinanceDemoRequest(request, "extract");
  if (rejected) return rejected;
  const key = process.env.SARVAM_API_KEY;
  if (!key) return json({ error: "Sarvam is not configured" }, 503);
  try {
    const pdf = await readFile(path.join(process.cwd(), "public", "sample-payslip.pdf"));
    const form = new FormData();
    form.append("file", new Blob([pdf], { type: "application/pdf" }), "sample-payslip.pdf");
    form.append("schema", schema);
    form.append("output_format", "json");
    const response = await fetch(`${base}/extract`, {
      method: "POST", headers: { "api-subscription-key": key }, body: form,
      signal: AbortSignal.timeout(20000), cache: "no-store",
    });
    if (!response.ok) return json({ error: "Document AI could not start" }, 502);
    const data = await response.json();
    const jobId = data?.job_id;
    if (typeof jobId !== "string" || !/^[\w-]{8,100}$/.test(jobId)) return json({ error: "Invalid Document AI job" }, 502);
    return json({ jobId, token: token(jobId, key), status: data.status }, 202);
  } catch { return json({ error: "Document AI is unavailable" }, 502); }
}

export async function GET(request: Request): Promise<Response> {
  const key = process.env.SARVAM_API_KEY;
  if (!key) return json({ error: "Sarvam is not configured" }, 503);
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId") || "";
  const supplied = url.searchParams.get("token") || "";
  const expected = token(jobId, key);
  if (!/^[\w-]{8,100}$/.test(jobId) || !/^[a-f0-9]{64}$/.test(supplied) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return json({ error: "Invalid job" }, 403);
  try {
    const statusResponse = await fetch(`${base}/${jobId}/status`, { headers: { "api-subscription-key": key }, signal: AbortSignal.timeout(12000), cache: "no-store" });
    if (!statusResponse.ok) return json({ error: "Document AI status unavailable" }, 502);
    const status = (await statusResponse.json())?.status;
    if (status === "failed" || status === "rejected") return json({ error: "Document AI could not read the sample" }, 502);
    if (status !== "completed" && status !== "partially_completed") return json({ status: "processing" }, 202);
    const resultResponse = await fetch(`${base}/${jobId}/results?format=json`, { headers: { "api-subscription-key": key }, signal: AbortSignal.timeout(12000), cache: "no-store" });
    if (!resultResponse.ok) return json({ error: "Document AI result unavailable" }, 502);
    const data = await resultResponse.json();
    const result = data?.result;
    const annotations = data?.annotations;
    if (!result || typeof result !== "object") return json({ error: "Invalid extraction result" }, 502);
    const fullName = typeof result.full_name === "string" ? result.full_name.trim().slice(0, 100) : "";
    const incomeRaw = result.monthly_income;
    const monthlyIncome = typeof incomeRaw === "number" ? incomeRaw : typeof incomeRaw === "string" && /^(?:INR|₹)?\s*[\d,]+(?:\.\d{1,2})?$/i.test(incomeRaw.trim()) ? Number(incomeRaw.replace(/INR|₹|,/gi, "").trim()) : NaN;
    const employment = typeof result.employment_type === "string" ? result.employment_type.trim().slice(0, 80) : "";
    const period = typeof result.pay_period === "string" ? result.pay_period.trim().slice(0, 80) : "";
    if (!fullName || !Number.isFinite(monthlyIncome) || monthlyIncome <= 0 || monthlyIncome > 10000000) return json({ error: "The sample needs manual review" }, 502);
    const confidence = (field: string) => typeof annotations?.[field]?.confidence === "number" && Number.isFinite(annotations[field].confidence) ? Math.max(0, Math.min(100, Math.round(annotations[field].confidence * 100))) : null;
    return json({ status: "completed", fields: { fullName, monthlyIncome, employment, period }, confidence: { fullName: confidence("full_name"), monthlyIncome: confidence("monthly_income"), employment: confidence("employment_type"), period: confidence("pay_period") }, source: "Sarvam Document AI · sample-payslip.pdf · page 1" });
  } catch { return json({ error: "Document AI is unavailable" }, 502); }
}
