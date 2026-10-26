"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuditResult } from "@/lib/audit-types";
import type { JourneyResult, JourneyRun } from "@/lib/journey-types";
import styles from "./page.module.css";

type ViewState = "idle" | "submitting" | "running" | "complete" | "error";
type AuditState = "idle" | "running" | "complete" | "error";

const demoRoute = [
  "https://access-path-mu.vercel.app/demo-site",
  "https://access-path-mu.vercel.app/demo-site/support",
  "https://access-path-mu.vercel.app/demo-site/contact",
];

export default function NewJourneyPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [runId, setRunId] = useState<string | null>(null);
  const [result, setResult] = useState<JourneyResult | null>(null);
  const [error, setError] = useState("");
  const [auditState, setAuditState] = useState<AuditState>("idle");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditError, setAuditError] = useState("");
  const [reportError, setReportError] = useState("");
  const busy = viewState === "submitting" || viewState === "running" || auditState === "running";
  const showAudit = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (!runId) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let checks = 0;

    async function poll() {
      if (stopped) return;
      checks += 1;
      try {
        const response = await fetch(`/api/journeys/${encodeURIComponent(runId!)}`, {
          headers: { "x-accesspath-demo-code": accessCode },
          cache: "no-store",
        });
        const data: JourneyRun & { error?: string } = await response.json();
        if (stopped) return;
        if (!response.ok) throw new Error(data.error || "Could not refresh this journey.");
        if (data.status === "COMPLETED") {
          if (!data.result) throw new Error(data.error || "No journey was returned.");
          setResult(data.result);
          setViewState("complete");
          setRunId(null);
          return;
        }
        if (data.status === "FAILED" || data.status === "CANCELLED") {
          throw new Error(data.error || "The journey could not be completed.");
        }
        if (checks >= 45) throw new Error("The journey is taking longer than expected. Try again after checking the TinyFish dashboard.");
        timer = setTimeout(poll, 3000);
      } catch (cause) {
        if (stopped) return;
        setError(cause instanceof Error ? cause.message : "Something went wrong.");
        setViewState("error");
        setRunId(null);
      }
    }

    void poll();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [runId, accessCode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setResult(null);
    setRunId(null);
    setViewState("submitting");

    try {
      const response = await fetch("/api/journeys", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-accesspath-demo-code": accessCode },
        body: JSON.stringify({ url: url.trim(), goal: goal.trim() }),
      });
      const data: { runId?: string; error?: string } = await response.json();
      if (!response.ok || !data.runId) throw new Error(data.error || "The journey could not be started.");
      setViewState("running");
      setRunId(data.runId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
      setViewState("error");
    }
  }

  function reset() {
    setRunId(null);
    setResult(null);
    setError("");
    setViewState("idle");
    setAuditState("idle");
    setAuditResult(null);
    setAuditError("");
    setReportError("");
  }

  async function auditJourney() {
    if (busy || auditState === "complete") return;
    if (!accessCode) {
      setAuditError("Enter the private preview code above before starting the audit.");
      setAuditState("error");
      return;
    }
    const urls = result?.outcome === "completed" && result.steps.length > 0
      ? result.steps.slice(0, 3).map((step) => step.url)
      : demoRoute;
    setAuditError("");
    setAuditResult(null);
    setAuditState("running");
    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-accesspath-demo-code": accessCode },
        body: JSON.stringify({ urls }),
      });
      const data: AuditResult & { error?: string } = await response.json();
      if (!response.ok || !Array.isArray(data.pages)) throw new Error(data.error || "The audit could not finish.");
      setAuditResult(data);
      setAuditState("complete");
    } catch (cause) {
      setAuditError(cause instanceof Error ? cause.message : "The audit could not finish.");
      setAuditState("error");
    }
  }

  function downloadAudit() {
    if (!auditResult) return;
    const file = new Blob([JSON.stringify(auditResult, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = `accesspath-audit-${auditResult.checkedAt.slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function openReport() {
    if (!auditResult) return;
    try {
      sessionStorage.setItem("accesspath:local-audit-report", JSON.stringify(auditResult));
      router.push("/reports/local");
    } catch {
      setReportError("Could not open the report from this tab. Download the audit JSON, then import it at /reports/local.");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="AccessPath home">
          <span className={styles.mark} aria-hidden="true">
            <svg viewBox="0 0 36 36" fill="none">
              <path d="M7 28V9h10c7 0 12 4 12 10s-5 9-11 9H7Z" stroke="currentColor" strokeWidth="2.4" />
              <path d="M13 22h7M13 16h7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </span>
          <span>accesspath<span className={styles.period}>.</span></span>
        </Link>
        <span className={styles.headerLabel}>JOURNEY STUDIO / PRIVATE PREVIEW</span>
        <Link className={styles.backLink} href="/">Back to home <span aria-hidden="true">↗</span></Link>
      </header>

      <div className={styles.layout}>
        <section className={styles.intro} aria-labelledby="journey-title">
          <div className={styles.eyebrow}><span className={styles.eyebrowLine} /> FIELD NOTE 001 / DISCOVERY</div>
          <h1 id="journey-title">Start with<br />a <em>real goal.</em></h1>
          <p className={styles.lead}>Give AccessPath a public website and a task a visitor needs to complete. TinyFish will follow the route and return the pages it actually visited.</p>
          <div className={styles.progress} aria-label="Workflow stage one of three">
            <span className={styles.progressActive}>01 <b>DISCOVER</b></span>
            <span>02 <b>AUDIT</b></span>
            <span>03 <b>REPORT</b></span>
          </div>
          <p className={styles.scope}>Discover a route, then run bounded accessibility checks on the approved Northstar demo. Automated findings still need human review.</p>
        </section>

        <section className={styles.workspace} aria-label="Create a journey">
          <div className={styles.workspaceTop}><span>NEW JOURNEY / 001</span><span className={styles.liveBadge}><i /> TINYFISH LIVE ROUTE</span></div>
          <form onSubmit={submit} className={styles.form}>
            <div className={styles.formIntro}>
              <span className={styles.formIndex}>INPUT / 01</span>
              <h2>Describe the path to explore.</h2>
              <p>Use an approved public demo site. The agent will inspect the journey without submitting forms or changing data.</p>
            </div>

            <label className={styles.field}>
              <span>PUBLIC WEBSITE URL <small>01</small></span>
              <input type="url" required maxLength={2048} placeholder="https://your-demo-site.com" value={url} onChange={(event) => setUrl(event.target.value)} disabled={busy} autoComplete="url" />
              <small>Start with https:// and use a site approved for this preview.</small>
            </label>

            <label className={styles.field}>
              <span>VISITOR GOAL <small>02</small></span>
              <textarea required minLength={12} maxLength={180} rows={3} placeholder="Find the contact form and understand how to reach the team." value={goal} onChange={(event) => setGoal(event.target.value)} disabled={busy} />
              <small>Describe one task in plain language. 12–180 characters.</small>
            </label>

            <label className={styles.field}>
              <span>PREVIEW ACCESS CODE <small>03</small></span>
              <input type="password" required placeholder="Enter the team preview code" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} disabled={busy} autoComplete="off" />
              <small>This private preview limits live API usage.</small>
            </label>

            <button className={styles.submit} type="submit" disabled={busy}>
              <span>{busy ? "Exploring the journey…" : "Explore this journey"}</span><span aria-hidden="true">↗</span>
            </button>
          </form>

          <div className={styles.result} aria-live="polite" aria-atomic="true">
            <div className={styles.resultHead}><span>JOURNEY OUTPUT</span><span>{viewState === "complete" ? "READY" : viewState === "running" ? "IN PROGRESS" : "AWAITING INPUT"}</span></div>
            {viewState === "idle" && <p className={styles.empty}>Your live route will appear here after the agent finishes.</p>}
            {viewState === "submitting" && <p className={styles.pending}>Connecting to TinyFish…</p>}
            {viewState === "running" && <p className={styles.pending}>TinyFish is following the visitor goal. This can take a minute or two.</p>}
            {viewState === "error" && <div className={styles.error} role="alert"><strong>Journey paused.</strong><p>{error}</p><button type="button" onClick={reset}>Try again →</button></div>}
            {viewState === "complete" && result && (
              <div className={styles.complete}>
                <div className={styles.resultSummary}><span>{result.outcome.replace("_", " ").toUpperCase()}</span><p>{result.summary}</p></div>
                {result.scopeNote && <p className={styles.scopeWarning}>{result.scopeNote}</p>}
                <ol className={styles.steps}>
                  {result.steps.map((step, index) => (
                    <li key={`${index}-${step.url}`}>
                      <span className={styles.stepIndex}>{String(index + 1).padStart(2, "0")}</span>
                      <div><strong>{step.title}</strong><small>{step.url}</small><p>{step.action}</p><p className={styles.observation}>{step.observation}</p></div>
                    </li>
                  ))}
                </ol>
                <p className={styles.resultNote}>Live journey discovery is complete. Run the separate audit below to check these pages.</p>
                <button className={styles.another} type="button" onClick={reset}>Explore another journey ↗</button>
              </div>
            )}
          </div>
          {showAudit && <section className={styles.auditPanel} aria-labelledby="audit-title">
            <div className={styles.auditEyebrow}>02 / AUDIT THE ROUTE</div>
            <h2 id="audit-title">See what the pages reveal.</h2>
            <p>Runs axe-core in one TinyFish Browser session across up to three approved pages. This paid preview checks the completed route, or the same demo route directly if you have not run discovery in this tab.</p>
            <button className={styles.auditButton} type="button" onClick={auditJourney} disabled={busy || auditState === "complete"}>
              <span>{auditState === "running" ? "Auditing the pages…" : auditState === "complete" ? "Audit complete" : result?.outcome === "completed" ? "Audit this journey" : "Audit the controlled demo"}</span>
              <span aria-hidden="true">↗</span>
            </button>
            {auditState === "error" && <p className={styles.auditError} role="alert">{auditError}</p>}
            {auditState === "running" && <p className={styles.auditStatus} role="status">Checking the pages and collecting evidence. Keep this tab open for up to three minutes.</p>}
            {auditState === "complete" && auditResult && (
              <div className={styles.auditReport}>
                <p className={styles.auditMeta}>CHECKED {new Date(auditResult.checkedAt).toLocaleString()} / {auditResult.pages.length} PAGES</p>
                {auditResult.pages.map((page, index) => (
                  <article className={styles.auditPage} key={page.url}>
                    <div className={styles.auditPageHead}><span>{String(index + 1).padStart(2, "0")}</span><h3>{page.title || "Audited page"}</h3></div>
                    <p className={styles.auditUrl}>{page.url}</p>
                    <p className={styles.auditCount}>{page.violations.length} rules with violations <span>·</span> {page.needsReviewCount} rules needing review</p>
                    {page.screenshot && <img className={styles.auditScreenshot} src={page.screenshot} alt={`Captured viewport of ${page.title || page.url}`} />}
                    {page.violations.length > 0 ? (
                      <ul className={styles.auditViolations}>{page.violations.map((finding) => (
                        <li key={finding.id}>
                          <strong>{finding.help}</strong>
                          <span>{finding.impact || "unclassified"} / {finding.affectedCount} affected element{finding.affectedCount === 1 ? "" : "s"}</span>
                          {finding.selectors.length > 0 && <code>{finding.selectors.join(", ")}</code>}
                          {finding.helpUrl && <a href={finding.helpUrl} target="_blank" rel="noopener noreferrer">Rule guidance ↗</a>}
                        </li>
                      ))}</ul>
                    ) : <p className={styles.auditClear}>No automated violations were detected for the selected WCAG rules on this page.</p>}
                  </article>
                ))}
                <p className={styles.auditNote}>{auditResult.note}</p>
                <div className={styles.auditActions}>
                  <button className={styles.auditDownload} type="button" onClick={openReport}>Open printable report ↗</button>
                  <button className={styles.auditDownload} type="button" onClick={downloadAudit}>Download audit JSON ↗</button>
                </div>
                {reportError && <p className={styles.auditError} role="alert">{reportError}</p>}
              </div>
            )}
          </section>}
          <div className={styles.workspaceFoot}><span>ACCESSPATH / JOURNEY DISCOVERY</span><span>PRIVATE DEMO BUILD</span></div>
        </section>
      </div>
    </main>
  );
}
