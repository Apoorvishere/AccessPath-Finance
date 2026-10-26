"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { SCAN_TARGETS } from "@/lib/scan-targets";
import styles from "./page.module.css";

type ScanFailureCode =
  | "journey_blocked"
  | "journey_loop"
  | "goal_not_found"
  | "journey_failed"
  | "audit_failed"
  | "saving_failed";

type SavedScan = {
  id: string;
  source: string;
  target_url: string;
  task: string;
  status: string;
  failure_code: ScanFailureCode | null;
  created_at: string;
  finished_at: string | null;
};

type Draft = { report: unknown; key: string; name: string };
type AccessState = "checking" | "ready" | "unavailable";

function failureSummary(code: ScanFailureCode | null): string {
  switch (code) {
    case "journey_blocked":
      return "The route could not be safely followed inside the approved pages. Try a simpler visitor goal.";
    case "journey_loop":
      return "The agent repeated the same page and action. The saved route shows where it happened; no accessibility audit was run.";
    case "goal_not_found":
      return "The agent did not reach a page that matched the goal. Try naming the page or action more clearly.";
    case "journey_failed":
      return "Route discovery did not finish. Check that the approved site is available, then try again.";
    case "audit_failed":
      return "The route was found, but the page checks did not finish. Check the target page and worker status before another attempt.";
    case "saving_failed":
      return "The report could not be saved after processing. Check worker and provider logs before retrying to avoid a duplicate paid run.";
    default:
      return "No report was saved. Check the worker logs before trying again.";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [scans, setScans] = useState<SavedScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [task, setTask] = useState("Find the contact form through the support page.");
  const [saving, setSaving] = useState(false);

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const liveEnabled =
    process.env.NEXT_PUBLIC_ACCESSPATH_LIVE_SCANS_ENABLED === "true";

  const [targetUrl, setTargetUrl] = useState<string>(SCAN_TARGETS[0].url);
  const [liveTask, setLiveTask] = useState<string>(
    SCAN_TARGETS[0].exampleGoal,
  );
  const [liveBusy, setLiveBusy] = useState(false);
  const [liveError, setLiveError] = useState("");
  const [liveMessage, setLiveMessage] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const loadScans = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }

    try {
      const response = await fetch("/api/scans", { cache: "no-store" });

      if (response.status === 401) {
        setAccessState("checking");
        router.replace("/audit/login");
        return;
      }

      const data: { scans?: SavedScan[]; error?: string } =
        await response.json();

      if (!response.ok || !Array.isArray(data.scans)) {
        throw new Error(data.error || "Could not load scans.");
      }

      setScans(data.scans);
      setAccessState("ready");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load scans.",
      );

      // On the first load, keep private content hidden if access could not
      // be confirmed. A later background refresh should not hide an already
      // authorized dashboard just because the network briefly failed.
      if (!silent) setAccessState("unavailable");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (configured) {
        void loadScans();
      } else {
        setLoading(false);
        setAccessState("unavailable");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [configured, loadScans]);

  useEffect(() => {
    if (!scans.some((scan) => scan.status === "queued" || scan.status === "running")) {
      return;
    }

    const timer = setTimeout(() => {
      void loadScans(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, [scans, loadScans]);

  async function startLive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (liveBusy || !liveEnabled) return;

    setLiveBusy(true);
    setLiveError("");
    setLiveMessage("");

    try {
      const response = await fetch("/api/scans", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ targetUrl, task: liveTask.trim() }),
      });

      if (response.status === 401) {
        setAccessState("checking");
        router.replace("/audit/login");
        return;
      }

      const data: { id?: string; error?: string } = await response.json();

      if (!response.ok || !data.id) {
        throw new Error(data.error || "Could not queue this scan.");
      }

      setLiveMessage("Scan queued. This list refreshes while it runs.");
      await loadScans(true);
    } catch (cause) {
      setLiveError(
        cause instanceof Error ? cause.message : "Could not queue this scan.",
      );
    } finally {
      setLiveBusy(false);
    }
  }

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");
    setDraft(null);

    try {
      if (file.size > 800_000) {
        throw new Error("Choose an audit JSON smaller than 800 KB.");
      }

      const report: unknown = JSON.parse(await file.text());

      if (
        !report ||
        typeof report !== "object" ||
        !Array.isArray((report as { pages?: unknown }).pages)
      ) {
        throw new Error("This is not an AccessPath audit export.");
      }

      setDraft({ report, key: crypto.randomUUID(), name: file.name });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not read this file.",
      );
    } finally {
      event.target.value = "";
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/scans/import", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": draft.key,
        },
        body: JSON.stringify({ task: task.trim(), report: draft.report }),
      });

      if (response.status === 401) {
        setAccessState("checking");
        router.replace("/audit/login");
        return;
      }

      const data: { id?: string; error?: string } = await response.json();

      if (!response.ok || !data.id) {
        throw new Error(data.error || "Could not save this audit.");
      }

      setDraft(null);
      setMessage("Audit saved to your workspace.");
      await loadScans();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save this audit.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    // Hide the private workspace as soon as sign-out starts.
    setAccessState("checking");

    try {
      await createBrowserSupabase().auth.signOut({ scope: "local" });
    } finally {
      router.replace("/");
    }
  }

  function toggleCompare(id: string) {
    setCompareIds((current) =>
      current.includes(id)
        ? current.filter((selected) => selected !== id)
        : current.length < 2
          ? [...current, id]
          : current,
    );
  }

  // Do not render private workspace content until the API confirms the session.
  // These branches appear after all hooks so their order stays consistent.
  if (!configured) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <p className={styles.alert} role="status">
            Supabase isn’t configured, so sign-in can’t be checked. Add the
            project settings to enable accounts and saved reports.
          </p>
        </div>
      </main>
    );
  }

  if (accessState === "checking") {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <p className={styles.status} role="status">
            Checking your sign-in…
          </p>
        </div>
      </main>
    );
  }

  if (accessState === "unavailable") {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <p className={styles.error} role="alert">
            {error || "We couldn’t confirm your sign-in. Your workspace is hidden."}
          </p>
          <a href="/audit/login">Go to sign in ↗</a>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          accesspath<span>.</span>
        </Link>
        <span>PRIVATE WORKSPACE</span>
        <button type="button" onClick={signOut} disabled={!configured}>
          Sign out ↗
        </button>
      </header>

      <div className={styles.shell}>
        <div className={styles.eyebrow}>WORKSPACE / SAVED EVIDENCE</div>

        <div className={styles.hero}>
          <div>
            <h1>
              Your reports,
              <br />
              <em>in one place.</em>
            </h1>
            <p>
              Import a controlled-demo audit and keep its findings available
              across visits. Each account sees only its own saved scans.
            </p>
          </div>
          <div className={styles.heroCount}>
            <strong>{scans.length}</strong>
            <span>RECENT SCANS</span>
          </div>
        </div>

        {liveEnabled && (
          <section className={styles.importPanel} aria-labelledby="live-title">
            <div>
              <span className={styles.sectionIndex}>01 / LIVE CONTROLLED SCAN</span>
              <h2 id="live-title">Follow a real route.</h2>
              <p>
                Choose an approved public site and write your own visitor goal.
                The agent can read up to three visited pages within the chosen
                site. Tasks that need login, form submission, or pages outside
                the approved area cannot complete.
              </p>
            </div>

            <div className={styles.importForm}>
              <form onSubmit={startLive}>
                <label>
                  APPROVED SITE
                  <select
                    className={styles.siteSelect}
                    value={targetUrl}
                    onChange={(event) => {
                      const selected = SCAN_TARGETS.find(
                        (target) => target.url === event.target.value,
                      );
                      if (selected) {
                        setTargetUrl(selected.url);
                        setLiveTask(selected.exampleGoal);
                      }
                    }}
                    disabled={liveBusy}
                  >
                    {SCAN_TARGETS.map((target) => (
                      <option value={target.url} key={target.url}>
                        {target.label}
                      </option>
                    ))}
                  </select>
                </label>

                <small className={styles.siteUrl}>{targetUrl}</small>

                <label>
                  VISITOR GOAL
                  <input
                    required
                    minLength={12}
                    maxLength={180}
                    value={liveTask}
                    onChange={(event) => setLiveTask(event.target.value)}
                    disabled={liveBusy}
                  />
                </label>

                <button type="submit" disabled={liveBusy || !configured}>
                  {liveBusy ? "Queuing…" : "Start controlled scan"}
                  <span aria-hidden="true">↗</span>
                </button>
              </form>

              {liveError && (
                <p className={styles.error} role="alert">
                  {liveError}
                </p>
              )}
              {liveMessage && (
                <p className={styles.success} role="status">
                  {liveMessage}
                </p>
              )}
            </div>
          </section>
        )}

        <section className={styles.importPanel} aria-labelledby="import-title">
          <div>
            <span className={styles.sectionIndex}>
              {liveEnabled ? "02" : "01"} / SAVE EVIDENCE
            </span>
            <h2 id="import-title">Bring in your audit.</h2>
            <p>
              The existing JSON export is enough. This import does not run
              TinyFish or use API credits.
            </p>
          </div>

          <div className={styles.importForm}>
            <label className={styles.fileLabel}>
              AUDIT JSON
              <input
                type="file"
                accept=".json,application/json"
                onChange={selectFile}
                disabled={saving}
              />
            </label>

            {draft && (
              <form onSubmit={save}>
                <small>SELECTED / {draft.name}</small>
                <label>
                  VISITOR GOAL
                  <input
                    required
                    minLength={12}
                    maxLength={180}
                    value={task}
                    onChange={(event) => setTask(event.target.value)}
                    disabled={saving}
                  />
                </label>
                <button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save to my workspace"}
                  <span aria-hidden="true">↗</span>
                </button>
              </form>
            )}

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className={styles.success} role="status">
                {message}
              </p>
            )}
          </div>
        </section>

        <section className={styles.saved} aria-labelledby="saved-title">
          <div className={styles.sectionHead}>
            <span>{liveEnabled ? "03" : "02"} / MY SAVED SCANS</span>
            <span>OWNER ONLY</span>
          </div>
          <h2 id="saved-title">Evidence library.</h2>
          <p className={styles.compareHelp}>
            Select two completed reports to compare findings. This uses saved
            evidence and does not start a scan.
          </p>

          {compareIds.length === 2 && (
            <div className={styles.compareAction} role="status">
              <span>
                Two reports selected in order: first is Before, second is After.
              </span>
              <div>
                <a
                  href={`/reports/compare?before=${encodeURIComponent(compareIds[0])}&after=${encodeURIComponent(compareIds[1])}`}
                >
                  Compare reports ↗
                </a>
                <button type="button" onClick={() => setCompareIds([])}>
                  Clear
                </button>
              </div>
            </div>
          )}

          {compareIds.length === 1 && (
            <p className={styles.compareSelected} role="status">
              One report selected as Before. Select a second completed report as
              After.
            </p>
          )}

          {loading && (
            <p className={styles.status} role="status">
              Loading your reports…
            </p>
          )}

          {!loading && scans.length === 0 && (
            <p className={styles.status}>
              No saved reports yet. Import the audit you downloaded from the
              journey studio.
            </p>
          )}

          <ol>
            {scans.map((scan, index) => (
              <li key={scan.id}>
                <span className={styles.index}>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div>
                  <strong>{scan.task}</strong>
                  <small>{scan.target_url}</small>
                  <span>
                    {scan.source.toUpperCase()} / {scan.status.toUpperCase()} /{" "}
                    {new Date(scan.created_at).toLocaleDateString()}
                  </span>
                </div>

                {scan.status === "completed" || scan.status === "partial" ? (
                  <div className={styles.rowActions}>
                    <a href={`/reports/local?scan=${encodeURIComponent(scan.id)}`}>
                      Open report ↗
                    </a>
                    <button
                      type="button"
                      aria-pressed={compareIds.includes(scan.id)}
                      disabled={
                        compareIds.length === 2 && !compareIds.includes(scan.id)
                      }
                      onClick={() => toggleCompare(scan.id)}
                    >
                      {compareIds.includes(scan.id)
                        ? compareIds[0] === scan.id
                          ? "Before selected"
                          : "After selected"
                        : "Select to compare"}
                    </button>
                  </div>
                ) : scan.status === "failed" && scan.failure_code === "journey_loop" ? (
                  <a href={`/reports/local?scan=${encodeURIComponent(scan.id)}`}>
                    Review stopped route ↗
                  </a>
                ) : (
                  <span className={styles.scanState} aria-live="polite">
                    {scan.status === "queued"
                      ? "WAITING FOR WORKER"
                      : scan.status === "running"
                        ? "IN PROGRESS"
                        : scan.status === "cancelled"
                          ? "CANCELLED"
                          : "FAILED"}
                  </span>
                )}

                {scan.status === "failed" && (
                  <p className={styles.failureSummary}>
                    {failureSummary(scan.failure_code)}
                  </p>
                )}

                {scan.status === "cancelled" && (
                  <p className={styles.failureSummary}>
                    This attempt was cancelled and no report was saved. Start a
                    new scan when you are ready.
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>

        <p className={styles.scope}>
          Automated findings require human review. A completed scan is not a
          conformance certificate.
        </p>
      </div>
    </main>
  );
}
