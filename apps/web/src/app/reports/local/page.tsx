"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import type { AuditResult, AuditViolation } from "@/lib/audit-types";
import type { JourneyResult } from "@/lib/journey-types";
import styles from "./page.module.css";

const STORAGE_KEY = "accesspath:local-audit-report";
const MAX_FILE_BYTES = 5_000_000;

function safeHttps(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function repeatedStep(steps: JourneyResult["steps"]): { first: number; repeated: number } | null {
  const seen = new Map<string, number>();
  for (const [index, step] of steps.entries()) {
    const key = `${step.url}\n${step.action.trim().toLowerCase().replace(/\s+/g, " ")}`;
    const first = seen.get(key);
    if (first !== undefined) return { first, repeated: index };
    seen.set(key, index);
  }
  return null;
}

function parseAudit(value: unknown): AuditResult {
  if (!value || typeof value !== "object") throw new Error("This file is not an AccessPath audit export.");
  const result = value as Partial<AuditResult>;
  if (typeof result.checkedAt !== "string" || !Number.isFinite(Date.parse(result.checkedAt))) {
    throw new Error("The audit is missing a valid check time.");
  }
  if (typeof result.note !== "string") throw new Error("The audit is missing its scope note.");
  if (!Array.isArray(result.pages) || result.pages.length < 1 || result.pages.length > 3) {
    throw new Error("The audit must contain one to three checked pages.");
  }
  for (const page of result.pages) {
    if (!page || typeof page !== "object" || typeof page.url !== "string" || !safeHttps(page.url) ||
        typeof page.title !== "string" || !Array.isArray(page.violations) ||
        !Number.isInteger(page.needsReviewCount) || page.needsReviewCount < 0 ||
        !Number.isInteger(page.passedRuleCount) || page.passedRuleCount < 0) {
      throw new Error("A checked page is incomplete or has an invalid URL.");
    }
    if (page.screenshot !== null &&
        (typeof page.screenshot !== "string" || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(page.screenshot))) {
      throw new Error("A screenshot is not a supported JPEG image.");
    }
    if (page.metadata !== undefined) {
      const meta = page.metadata;
      if (!meta || typeof meta !== "object" ||
          (meta.description !== null && (typeof meta.description !== "string" || meta.description.length > 300)) ||
          (meta.language !== null && (typeof meta.language !== "string" || meta.language.length > 40)) ||
          (meta.robots !== null && (typeof meta.robots !== "string" || meta.robots.length > 100)) ||
          (meta.canonicalUrl !== null && (typeof meta.canonicalUrl !== "string" || !safeHttps(meta.canonicalUrl))) ||
          !Array.isArray(meta.headings) || meta.headings.length > 12 ||
          !meta.headings.every(item => typeof item === "string" && item.length <= 120) ||
          !Array.isArray(meta.approvedLinks) || meta.approvedLinks.length > 12 ||
          !meta.approvedLinks.every(link => link && typeof link.label === "string" && link.label.length <= 100 &&
            typeof link.url === "string" && safeHttps(link.url) && new URL(link.url).origin === new URL(page.url).origin)) {
        throw new Error("A page map in this export is invalid.");
      }
    }
    for (const finding of page.violations) {
      if (!finding || typeof finding.id !== "string" || typeof finding.help !== "string" ||
          (finding.impact !== null && typeof finding.impact !== "string") ||
          !Number.isInteger(finding.affectedCount) || finding.affectedCount < 0 ||
          !Array.isArray(finding.selectors) || !finding.selectors.every((item: unknown) => typeof item === "string") ||
          typeof finding.helpUrl !== "string") {
        throw new Error("A finding in this export is incomplete.");
      }
    }
  }
  return result as AuditResult;
}

function priority(impact: string | null): string {
  if (impact === "critical") return "Critical";
  if (impact === "serious") return "Serious";
  if (impact === "moderate") return "Moderate";
  if (impact === "minor") return "Minor";
  return "Unclassified";
}

function Finding({ finding, pageUrl, number }: { finding: AuditViolation; pageUrl: string; number: string }) {
  const guidance = safeHttps(finding.helpUrl);
  return (
    <article className={styles.finding}>
      <div className={styles.findingTop}>
        <span>FINDING {number}</span>
        <span className={styles.impact}>{priority(finding.impact).toUpperCase()}</span>
      </div>
      <h3>{finding.help}</h3>
      <p className={styles.findingDetail}>{finding.affectedCount} affected element{finding.affectedCount === 1 ? "" : "s"} on <a href={pageUrl} target="_blank" rel="noopener noreferrer">this page ↗</a></p>
      <div className={styles.evidence}>
        <span>RULE <strong>{finding.id}</strong></span>
        {finding.selectors.length > 0 && <span>ELEMENT <code>{finding.selectors.join(", ")}</code></span>}
      </div>
      <p className={styles.nextStep}>
        <strong>Next step</strong> — inspect the affected element, apply the rule guidance, then rerun the audit and verify the journey with a person.
      </p>
      {guidance && <a className={styles.guidance} href={guidance} target="_blank" rel="noopener noreferrer">Read axe rule guidance ↗</a>}
    </article>
  );
}

export default function LocalReportPage() {
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [source, setSource] = useState<"studio" | "file" | "saved" | null>(null);
  const [journey, setJourney] = useState<JourneyResult | null>(null);
  const [loopReview, setLoopReview] = useState<{ first: number; repeated: number } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
    const scanId = new URLSearchParams(window.location.search).get("scan");
    if (scanId) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scanId)) {
        setError("This saved-report link is invalid.");
        return;
      }
      void (async () => {
        try {
          const response = await fetch(`/api/scans/${encodeURIComponent(scanId)}`, { cache: "no-store" });
          const data: { scan?: { report?: unknown; journey?: unknown; status?: string; failure_code?: string | null }; error?: string } = await response.json();
          if (!response.ok) throw new Error(data.error || "Could not load this saved report.");
          const route = data.scan?.journey;
          let validJourney: JourneyResult | null = null;
          if (route && typeof route === "object" && !Array.isArray(route)) {
            const candidate = route as Partial<JourneyResult>;
            if (["completed", "not_found", "blocked"].includes(String(candidate.outcome)) &&
                typeof candidate.summary === "string" && Array.isArray(candidate.steps) && candidate.steps.length <= 6 &&
                candidate.steps.every(step => step && typeof step === "object" && typeof step.title === "string" && typeof step.url === "string" && typeof step.action === "string" && typeof step.observation === "string" && safeHttps(step.url))) {
              validJourney = candidate as JourneyResult;
            }
          }
          if (data.scan?.status === "failed" && data.scan.failure_code === "journey_loop") {
            const repeated = validJourney && repeatedStep(validJourney.steps);
            if (!validJourney || !repeated) throw new Error("This stopped route has no valid loop evidence to display.");
            setJourney(validJourney);
            setLoopReview(repeated);
            setAudit(null);
          } else {
            setAudit(parseAudit(data.scan?.report));
            if (validJourney?.outcome === "completed") setJourney(validJourney);
          }
          setSource("saved");
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load this saved report."); }
      })();
      return;
    }
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      setAudit(parseAudit(JSON.parse(saved)));
      setSource("studio");
    } catch {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* File import remains available. */ }
    }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error("Choose an audit export smaller than 5 MB.");
      const parsed = parseAudit(JSON.parse(await file.text()));
      setAudit(parsed);
      setJourney(null);
      setLoopReview(null);
      setSource("file");
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch { /* The imported file remains available in this tab. */ }
    } catch (cause) {
      setError(cause instanceof SyntaxError ? "This file is not valid JSON." : cause instanceof Error ? cause.message : "Could not read this audit export.");
    } finally {
      event.target.value = "";
    }
  }

  const findings = audit?.pages.flatMap((page) => page.violations.map((finding) => ({ pageUrl: page.url, finding }))) ?? [];
  const reviewed = audit?.pages.reduce((sum, page) => sum + page.needsReviewCount, 0) ?? 0;
  const affected = findings.reduce((sum, item) => sum + item.finding.affectedCount, 0);
  const checkedAt = audit ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(audit.checkedAt)) : "";

  return (
    <main className={styles.page}>
      <header className={styles.siteHeader}>
        <Link className={styles.brand} href="/" aria-label="AccessPath home">accesspath<span>.</span></Link>
        <span>REPORT / LOCAL PREVIEW</span>
        <Link href="/dashboard">My workspace ↗</Link>
      </header>

      <div className={styles.shell}>
        <div className={styles.eyebrow}>FIELD NOTE 003 / EVIDENCE</div>
        <div className={styles.hero}>
          <div>
            <h1>{loopReview ? <>Review the stopped<br /><em>route.</em></> : <>Make the findings<br /><em>actionable.</em></>}</h1>
            <p>{loopReview ? "The agent repeated a page and action. Review the recorded steps below; no accessibility audit was run for this scan." : "This report arranges one saved automated audit by page and finding. It keeps screenshots, affected elements, and checks needing human review together."}</p>
          </div>
          <div className={styles.heroAside}>
            <span>REPORT SOURCE</span>
            <strong>{loopReview ? "Stopped route" : source === "studio" ? "This tab’s audit" : source === "file" ? "Imported JSON" : source === "saved" ? "Saved to workspace" : "Awaiting audit"}</strong>
            <small>Local preview · no new scan or API charge</small>
          </div>
        </div>

        <section className={styles.importBar} aria-label="Report controls">
          <div>
            <label className={styles.importButton} htmlFor="audit-json">{audit ? "Replace audit JSON ↗" : "Import audit JSON ↗"}</label>
            <input id="audit-json" type="file" accept=".json,application/json" onChange={importFile} className={styles.fileInput} />
            {(audit || loopReview) && <button type="button" onClick={() => window.print()}>Print / save PDF ↗</button>}
          </div>
          <p>Use the file downloaded from the journey studio. The report stays in this browser tab.</p>
        </section>
        {error && <p className={styles.error} role="alert">{error}</p>}

        {loopReview && journey ? (
          <section className={styles.journey} aria-labelledby="loop-title">
            <div className={styles.sectionHead}><span>ROUTE REVIEW / POSSIBLE LOOP</span><span>NO ACCESSIBILITY AUDIT</span></div>
            <h2 id="loop-title">A step was repeated.</h2>
            <p>Step {loopReview.repeated + 1} repeated the same page and action as step {loopReview.first + 1}. The scan stopped before page checks, so this record contains no accessibility findings or conformance result.</p>
            <p>Agent summary: {journey.summary}</p>
            <ol>{journey.steps.map((step, index) => <li key={`${index}-${step.url}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{step.title}{index === loopReview.repeated ? " — repeated step" : ""}</strong><small>{step.url}</small><small>{step.action}</small><p>{step.observation}</p></div>
            </li>)}</ol>
          </section>
        ) : !audit ? (
          <section className={styles.empty}>
            <span>NO AUDIT LOADED</span>
            <h2>Bring in the evidence.</h2>
            <p>Import your AccessPath audit JSON to build the report. If you open this page straight from a completed audit in the same tab, it will load automatically.</p>
          </section>
        ) : (
          <>
            {journey && <section className={styles.journey} aria-labelledby="journey-title">
              <div className={styles.sectionHead}><span>LIVE DISCOVERY</span><span>{journey.steps.length} VISITED STEPS</span></div>
              <h2 id="journey-title">The route the agent followed.</h2>
              <p>{journey.summary}</p>
              <ol>{journey.steps.map((step, index) => <li key={`${index}-${step.url}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{step.title}</strong><small>{step.action}</small><p>{step.observation}</p></div>
              </li>)}</ol>
            </section>}
            <section className={styles.summary} aria-labelledby="summary-title">
              <div className={styles.sectionHead}><span>01 / OVERVIEW</span><span>CHECKED {checkedAt} IST</span></div>
              <h2 id="summary-title">A route with <em>{findings.length} detected {findings.length === 1 ? "rule" : "rules"}.</em></h2>
              <p>Automated axe-core checks ran in a TinyFish Browser session. Counts show rule violations, not a count of every accessibility barrier or a conformance score.</p>
              <div className={styles.metrics}>
                <div><strong>{audit.pages.length}</strong><span>PAGES CHECKED</span></div>
                <div><strong>{findings.length}</strong><span>RULES WITH VIOLATIONS</span></div>
                <div><strong>{affected}</strong><span>AFFECTED ELEMENTS</span></div>
                <div><strong>{reviewed}</strong><span>RULES NEEDING REVIEW*</span></div>
              </div>
              <small>* Sum of page-level counts; the same rule may appear on more than one page.</small>
            </section>

            <section className={styles.route} aria-labelledby="route-title">
              <div className={styles.sectionHead}><span>02 / CHECKED ROUTE</span><span>{audit.pages.length} PAGES</span></div>
              <h2 id="route-title">The pages in context.</h2>
              <ol>
                {audit.pages.map((page, index) => (
                  <li key={`${index}-${page.url}`}>
                    <span className={styles.routeNumber}>{String(index + 1).padStart(2, "0")}</span>
                    <div><strong>{page.title || new URL(page.url).pathname}</strong><a href={page.url} target="_blank" rel="noopener noreferrer">{page.url} ↗</a></div>
                    <span className={page.violations.length ? styles.routeFlag : styles.routeClear}>{page.violations.length ? `${page.violations.length} violation rule${page.violations.length === 1 ? "" : "s"}` : "0 detected violations"}</span>
                  </li>
                ))}
              </ol>
            </section>

            {audit.pages.some(page => page.metadata) && <section className={styles.pageMap} aria-labelledby="map-title">
              <div className={styles.sectionHead}><span>PAGE MAP / OBSERVED METADATA</span><span>{audit.pages.filter(page => page.metadata).length} MAPPED PAGES</span></div>
              <h2 id="map-title">What these pages reveal.</h2>
              <p>This map records metadata and approved links observed on checked pages. Linked pages that are not in the checked route were not audited. It is not a complete website sitemap.</p>
              {audit.pages.filter(page => page.metadata).map((page, index) => <article className={styles.mapCard} key={`${index}-${page.url}`}>
                <h3>{page.title || page.url}</h3>
                <small>{page.url}</small>
                <dl>
                  <div><dt>Description</dt><dd>{page.metadata?.description || "Not supplied"}</dd></div>
                  <div><dt>Language</dt><dd>{page.metadata?.language || "Not declared"}</dd></div>
                  <div><dt>Canonical</dt><dd>{page.metadata?.canonicalUrl || "No approved canonical URL recorded"}</dd></div>
                  <div><dt>Robots</dt><dd>{page.metadata?.robots || "Not declared"}</dd></div>
                </dl>
                <h4>Headings observed</h4>
                {page.metadata?.headings.length ? <ul>{page.metadata.headings.map((heading, headingIndex) => <li key={headingIndex}>{heading}</li>)}</ul> : <p>No H1 or H2 headings recorded.</p>}
                <h4>Approved links observed</h4>
                {page.metadata?.approvedLinks.length ? <ul>{page.metadata.approvedLinks.map(link => <li key={link.url}><a href={link.url} target="_blank" rel="noopener noreferrer">{link.label || link.url} ↗</a></li>)}</ul> : <p>No approved links recorded.</p>}
              </article>)}
            </section>}

            <section className={styles.findings} aria-labelledby="findings-title">
              <div className={styles.sectionHead}><span>03 / FINDINGS</span><span>REQUIRES TRIAGE</span></div>
              <h2 id="findings-title">What needs attention.</h2>
              {findings.length ? findings.map(({ finding, pageUrl }, index) => <Finding key={`${pageUrl}-${finding.id}-${index}`} finding={finding} pageUrl={pageUrl} number={String(index + 1).padStart(2, "0")} />) : <p className={styles.noFindings}>No violations were detected by the selected automated rules on these pages. Human evaluation remains necessary.</p>}
            </section>

            <section className={styles.evidenceSection} aria-labelledby="evidence-title">
              <div className={styles.sectionHead}><span>04 / PAGE EVIDENCE</span><span>VIEWPORT CAPTURES</span></div>
              <h2 id="evidence-title">Screenshots from the run.</h2>
              <div className={styles.shots}>
                {audit.pages.map((page, index) => <figure key={`${index}-${page.url}`}>
                  <figcaption><b>{String(index + 1).padStart(2, "0")}</b><span>{new URL(page.url).pathname}</span></figcaption>
                  {page.screenshot ? <img src={page.screenshot} alt={`Captured viewport of ${page.url}`} /> : <div className={styles.noImage}>No screenshot in this export.</div>}
                </figure>)}
              </div>
            </section>

            <section className={styles.review} aria-labelledby="review-title">
              <div className={styles.sectionHead}><span>05 / HUMAN REVIEW</span><span>BEFORE MAKING A CLAIM</span></div>
              <h2 id="review-title">Checks a person still needs to make.</h2>
              <ul>
                <li>Inspect each reported element in context and confirm the issue and proposed fix.</li>
                <li>Review the {reviewed} page-level rule checks marked as needing review in this run.</li>
                <li>Complete keyboard, screen-reader, focus-order, and task-completion checks with people.</li>
                <li>Rerun the same route after changes and compare the new evidence.</li>
              </ul>
              <p>{audit.note}</p>
            </section>
          </>
        )}
      </div>
      <footer className={styles.footer}><strong>accesspath<span>.</span></strong><p>Automated evidence supports accessibility work; it does not establish full conformance.</p><Link href="/journeys/new">Back to studio ↑</Link></footer>
    </main>
  );
}
