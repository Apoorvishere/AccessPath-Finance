import { createClient } from "@supabase/supabase-js";
import { auditApprovedPages } from "./audit";
import {
  auditUrlsFromJourney,
  discoverDemoJourney,
  repeatedJourneyStep,
  type Journey,
} from "./tinyfish";
import type { AuditResult } from "./audit-types";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

if (process.env.ACCESSPATH_WORKER_ENABLED !== "true") {
  throw new Error(
    "Worker is disabled. Set ACCESSPATH_WORKER_ENABLED=true only when ready."
  );
}

const supabase = createClient(
  required("SUPABASE_URL"),
  required("SUPABASE_SECRET_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const tinyfishKey = required("TINYFISH_API_KEY");

let stopping = false;
process.once("SIGINT", () => { stopping = true; });
process.once("SIGTERM", () => { stopping = true; });

type ClaimedScan = {
  scan_id: string;
  target_url: string;
  task: string;
};

function diagnostic(message: string): string {
  return message
    .replace(/(?:https?|wss?):\/\/\S+/gi, "[url]")
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[redacted]"
    )
    .slice(0, 240);
}

async function claim(): Promise<ClaimedScan | null> {
  const { data, error } = await supabase.rpc("claim_live_scan");

  if (error) {
    process.stderr.write(
      `Queue claim error ${error.code ?? "unknown"}: ${diagnostic(error.message)}\n`
    );
    throw new Error("Database queue claim failed");
  }

  if (!Array.isArray(data) || data.length === 0) return null;

  const scan = data[0] as Partial<ClaimedScan>;
  if (
    typeof scan.scan_id !== "string" ||
    typeof scan.target_url !== "string" ||
    typeof scan.task !== "string"
  ) {
    throw new Error("Database returned an invalid queued scan");
  }

  return scan as ClaimedScan;
}

function fitReport(report: AuditResult): AuditResult {
  // Leave room below the database's 2.5 MB report limit.
  const bytes = () => Buffer.byteLength(JSON.stringify(report), "utf8");

  while (bytes() > 2_000_000) {
    const largest = report.pages
      .filter(page => page.screenshot)
      .sort(
        (a, b) =>
          (b.screenshot?.length ?? 0) - (a.screenshot?.length ?? 0)
      )[0];

    if (!largest) {
      throw new Error("Audit report exceeds the database size cap");
    }

    largest.screenshot = null;
  }

  return report;
}

async function finish(
  scan: ClaimedScan,
  status: "completed" | "failed",
  journey: Journey | null,
  report: AuditResult | null,
  failureCode: string | null
): Promise<void> {
  const { data, error } = await supabase
    .from("scans")
    .update({
      status,
      journey,
      report,
      failure_code: failureCode,
      finished_at: new Date().toISOString(),
    })
    .eq("id", scan.scan_id)
    .eq("source", "live")
    .eq("status", "running")
    .select("id");

  if (error || !data?.length) {
    throw new Error("Could not save the scan outcome");
  }
}

async function processScan(scan: ClaimedScan): Promise<void> {
  let stage: "journey" | "audit" | "saving" = "journey";
  let journey: Journey | null = null;

  try {
    journey = await discoverDemoJourney(
      scan.target_url,
      scan.task,
      tinyfishKey
    );

    const repeated = repeatedJourneyStep(journey);
    if (repeated) {
      await finish(scan, "failed", journey, null, "journey_loop");
      process.stdout.write(
        `Scan ${scan.scan_id} flagged a repeated journey step at positions ${repeated.first + 1} and ${repeated.repeated + 1}.\n`
      );
      return;
    }

    const urls = auditUrlsFromJourney(journey);
    if (urls.length === 0) {
      await finish(
        scan,
        "failed",
        journey,
        null,
        journey.outcome === "blocked"
          ? "journey_blocked"
          : "goal_not_found"
      );
      process.stdout.write(
        `Scan ${scan.scan_id} finished without an auditable route.\n`
      );
      return;
    }

    stage = "audit";
    const report = fitReport(
      await auditApprovedPages(urls, scan.target_url, tinyfishKey)
    );

    stage = "saving";
    await finish(scan, "completed", journey, report, null);
    process.stdout.write(
      `Scan ${scan.scan_id} completed with ${report.pages.length} checked pages.\n`
    );
  } catch (error) {
    const reason =
      error instanceof Error
        ? diagnostic(error.message)
        : "unknown error";

    process.stderr.write(
      `Scan ${scan.scan_id} stopped during ${stage}: ${reason}\n`
    );

    try {
      await finish(scan, "failed", journey, null, `${stage}_failed`);
    } catch {
      process.stderr.write(
        `Scan ${scan.scan_id} needs manual database review; it will not be retried automatically.\n`
      );
    }
  }
}

process.stdout.write("AccessPath controlled-scan worker started.\n");

while (!stopping) {
  try {
    const scan = await claim();

    if (scan) {
      await processScan(scan);
    } else {
      await new Promise(resolve => setTimeout(resolve, 10_000));
    }
  } catch (error) {
    const reason =
      error instanceof Error
        ? diagnostic(error.message)
        : "unknown error";

    process.stderr.write(
      `Queue polling failed (${reason}); retrying without claiming a paid run.\n`
    );
    await new Promise(resolve => setTimeout(resolve, 20_000));
  }
}