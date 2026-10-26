"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Finding = { id: string; help: string; impact: string | null; affectedCount: number; selectors: string[] };
type AuditPage = { url: string; title: string; violations: Finding[] };
type SavedReport = { id: string; target_url: string; task: string; created_at: string; pages: AuditPage[] };
type ComparedFinding = { key: string; url: string; rule: string; help: string; impact: string | null; beforeCount: number; afterCount: number; state: "cleared" | "still" | "new" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseReport(value: unknown): AuditPage[] | null {
  if (!isRecord(value) || !Array.isArray(value.pages) || value.pages.length < 1 || value.pages.length > 3) return null;
  const pages: AuditPage[] = [];
  for (const raw of value.pages) {
    if (!isRecord(raw) || typeof raw.url !== "string" || typeof raw.title !== "string" || !Array.isArray(raw.violations)) return null;
    try { if (new URL(raw.url).protocol !== "https:") return null; } catch { return null; }
    const violations: Finding[] = [];
    for (const item of raw.violations) {
      if (!isRecord(item) || typeof item.id !== "string" || typeof item.help !== "string" ||
          (item.impact !== null && typeof item.impact !== "string") || !Number.isInteger(item.affectedCount) ||
          (item.affectedCount as number) < 0 || (item.affectedCount as number) > 100 ||
          !Array.isArray(item.selectors) || !item.selectors.every(selector => typeof selector === "string")) return null;
      violations.push({ id: item.id, help: item.help, impact: item.impact as string | null, affectedCount: item.affectedCount as number, selectors: item.selectors as string[] });
    }
    pages.push({ url: raw.url, title: raw.title, violations });
  }
  return pages;
}

async function loadReport(id: string): Promise<SavedReport> {
  const response = await fetch(`/api/scans/${encodeURIComponent(id)}`, { cache: "no-store" });
  const body: { scan?: Record<string, unknown>; error?: string } = await response.json();
  if (!response.ok || !body.scan) throw new Error(body.error || "Could not load one of the selected reports.");
  const pages = parseReport(body.scan.report);
  if (!pages || typeof body.scan.target_url !== "string" || typeof body.scan.task !== "string" || typeof body.scan.created_at !== "string") {
    throw new Error("Both selected scans need a saved completed report.");
  }
  return { id, target_url: body.scan.target_url, task: body.scan.task, created_at: body.scan.created_at, pages };
}

function date(value: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

export default function CompareReportsPage() {
  const [before, setBefore] = useState<SavedReport | null>(null);
  const [after, setAfter] = useState<SavedReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const beforeId = params.get("before") ?? "";
    const afterId = params.get("after") ?? "";
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuid.test(beforeId) || !uuid.test(afterId) || beforeId === afterId) {
      const timer = setTimeout(() => {
        setError("Choose two different saved reports from your workspace.");
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }
    let active = true;
    void Promise.all([loadReport(beforeId), loadReport(afterId)])
      .then(([first, second]) => { if (active) { setBefore(first); setAfter(second); } })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Could not load the selected reports."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const comparison = useMemo(() => {
    if (!before || !after) return null;
    const beforeUrls = new Set(before.pages.map(page => page.url));
    const afterUrls = new Set(after.pages.map(page => page.url));
    const commonUrls = new Set([...beforeUrls].filter(url => afterUrls.has(url)));
    const collect = (pages: AuditPage[]) => {
      const map = new Map<string, { url: string; finding: Finding }>();
      for (const page of pages) {
        if (!commonUrls.has(page.url)) continue;
        for (const finding of page.violations) map.set(`${page.url}\n${finding.id}`, { url: page.url, finding });
      }
      return map;
    };
    const prior = collect(before.pages);
    const current = collect(after.pages);
    const keys = new Set([...prior.keys(), ...current.keys()]);
    const findings: ComparedFinding[] = [...keys].map(key => {
      const first = prior.get(key);
      const second = current.get(key);
      return {
        key,
        url: first?.url ?? second!.url,
        rule: first?.finding.id ?? second!.finding.id,
        help: first?.finding.help ?? second!.finding.help,
        impact: second?.finding.impact ?? first?.finding.impact ?? null,
        beforeCount: first?.finding.affectedCount ?? 0,
        afterCount: second?.finding.affectedCount ?? 0,
        state: !first ? "new" : !second ? "cleared" : "still",
      };
    });
    return {
      commonUrls: [...commonUrls],
      findings,
      beforeAffected: findings.reduce((sum, item) => sum + item.beforeCount, 0),
      afterAffected: findings.reduce((sum, item) => sum + item.afterCount, 0),
      cleared: findings.filter(item => item.state === "cleared"),
      still: findings.filter(item => item.state === "still"),
      newlyDetected: findings.filter(item => item.state === "new"),
    };
  }, [before, after]);

  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.brand}>accesspath<span>.</span></Link><span>REPORT / BEFORE AND AFTER</span><Link href="/dashboard">Back to workspace ↗</Link></header>
    <div className={styles.shell}>
      <div className={styles.eyebrow}>FIELD NOTE 004 / CHANGE REVIEW</div>
      <section className={styles.hero} aria-labelledby="title">
        <div><h1 id="title">See what changed<br /><em>between runs.</em></h1><p>Compare findings on the same visited pages after a change. The comparison uses saved reports and does not start another scan.</p></div>
        {before && after && <div className={styles.metrics}><div><strong>{comparison?.cleared.length ?? 0}</strong><span>NOT DETECTED AFTER</span></div><div><strong>{comparison?.still.length ?? 0}</strong><span>STILL DETECTED</span></div><div><strong>{comparison?.newlyDetected.length ?? 0}</strong><span>NEWLY DETECTED</span></div></div>}
      </section>
      {loading && <p className={styles.message} role="status">Loading the two saved reports…</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {before && after && comparison && (comparison.commonUrls.length === 0
        ? <p className={styles.error} role="alert">These reports have no matching page URLs to compare. Choose two scans that visited at least one of the same pages.</p>
        : <>
          <section className={styles.pair} aria-label="Reports being compared">
            {[{ label: "BEFORE", report: before }, { label: "AFTER", report: after }].map(({ label, report }) => <article key={label}>
              <span>{label} / {date(report.created_at)}</span><strong>{report.task}</strong><small>{report.target_url}</small>
            </article>)}
          </section>
          {(before.task !== after.task || before.target_url !== after.target_url || before.pages.length !== after.pages.length) && <p className={styles.caveat}>The task, target, or number of visited pages differs. Results below include only matching page URLs, so treat this as a partial comparison.</p>}
          <section className={styles.scope} aria-labelledby="scope-title"><div><span>01 / MATCHED SCOPE</span><span>{comparison.commonUrls.length} PAGE{comparison.commonUrls.length === 1 ? "" : "S"}</span></div><h2 id="scope-title">Compare like with like.</h2><ul>{comparison.commonUrls.map(url => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{url} ↗</a></li>)}</ul><p>Only pages present in both reports are compared. Rules are matched by page URL and axe rule ID.</p></section>
          <section className={styles.overview} aria-labelledby="overview-title"><div className={styles.sectionHead}><span>02 / OBSERVED COUNTS</span><span>COMMON PAGES ONLY</span></div><h2 id="overview-title">Summed rule-level affected counts.</h2><div className={styles.counts}><div><span>BEFORE</span><strong>{comparison.beforeAffected}</strong></div><div aria-hidden="true">→</div><div><span>AFTER</span><strong>{comparison.afterAffected}</strong></div></div><p>Counts are summed across rule/page pairs; the same element can be counted by more than one rule. A lower total means fewer affected instances were recorded by these automated checks in the second report. It is not proof that a fix is complete or that the site conforms.</p></section>
          <section className={styles.results} aria-labelledby="results-title"><div className={styles.sectionHead}><span>03 / RULE-BY-RULE REVIEW</span><span>{comparison.findings.length} RULE/PAGE PAIRS</span></div><h2 id="results-title">What the checks recorded.</h2>
            {comparison.findings.length === 0 ? <p className={styles.message}>No violations were recorded on the matched pages in either report. Continue human checks for keyboard use, screen readers, focus, and task completion.</p> : <ol>{comparison.findings.map(item => <li key={item.key}>
              <span className={`${styles.state} ${styles[item.state]}`}>{item.state === "cleared" ? "NOT DETECTED AFTER" : item.state === "new" ? "NEWLY DETECTED" : "STILL DETECTED"}</span><div><strong>{item.help}</strong><small>{item.rule} · {item.impact ?? "impact not classified"}</small><a href={item.url} target="_blank" rel="noopener noreferrer">{item.url} ↗</a></div><span className={styles.delta}>{item.beforeCount} → {item.afterCount} affected</span>
            </li>)}</ol>}
          </section>
          <section className={styles.review}><span>HUMAN REVIEW / REQUIRED</span><p>Open the affected pages, inspect each element, and repeat the visitor task with keyboard and assistive technology. An automated rule no longer appearing in a later report is useful evidence, but a person must confirm the barrier and the fix in context.</p></section>
        </>)}
    </div>
    <footer className={styles.footer}><strong>accesspath<span>.</span></strong><p>Automated findings support review; they do not establish full accessibility conformance.</p><Link href="/dashboard">Back to workspace ↑</Link></footer>
  </main>;
}
