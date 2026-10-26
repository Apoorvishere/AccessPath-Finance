"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readJourneyEvents, type JourneyEvent } from "../../lib/journey-events";
import styles from "./page.module.css";

const stageNames = ["Need", "Document", "Details", "Costs", "Complete"];
const eventNames: Record<JourneyEvent["type"], string> = {
  step_completed: "Step completed",
  blocked: "Customer needed to recover",
  sample_document: "Sample document selected",
  sample_submitted: "Demo journey completed",
  comprehension_checked: "Cost understanding checked",
};
const detailNames: Record<string, string> = {
  amount_out_of_range: "Amount outside the sample range",
  sample_document_missing: "Sample document had not been selected",
  details_not_confirmed: "Suggested fields needed confirmation",
  terms_not_confirmed: "Illustrative terms needed confirmation",
  correct: "Answered correctly",
  retry: "Revisited the cost breakdown",
  manual_sample: "Prefilled sample fields",
  sarvam_document_ai: "Extracted with Sarvam Document AI",
};

export default function InsightsPage() {
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEvents(readJourneyEvents()));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const completed = new Set(events.filter((event) => event.type === "step_completed" || event.type === "sample_submitted").map((event) => event.step));
  const blockers = events.filter((event) => event.type === "blocked");
  const finished = events.some((event) => event.type === "sample_submitted");

  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.brand}>accesspath <strong>finance.</strong></Link><nav aria-label="Primary navigation"><Link href="/apply">Sample journey</Link><Link href="/audit">Original audit</Link></nav></header>
    <section className={styles.hero}><p>ACCESSPATH / JOURNEY EVIDENCE</p><h1>See where the journey needs help.</h1><div className={styles.heroBottom}><span>LOCAL DEMO VIEW · THIS BROWSER ONLY</span><p>Event records describe step completion and recovery in the sample application. They contain no name, income, document content or loan amount.</p></div></section>
    <div className={styles.content}>
      <section className={styles.summary} aria-label="Session summary"><div><span>STATUS</span><strong>{finished ? "Completed" : events.length ? "In progress" : "No journey yet"}</strong></div><div><span>STEPS COMPLETED</span><strong>{completed.size} / 4</strong></div><div><span>RECOVERY MOMENTS</span><strong>{blockers.length}</strong></div></section>
      <section className={styles.route} aria-labelledby="route-heading"><div className={styles.sectionHead}><div><p>01 / CUSTOMER ROUTE</p><h2 id="route-heading">The steps this customer took</h2></div><Link href="/apply">Open journey ↗</Link></div><ol>{stageNames.map((name, index) => <li key={name} className={index < 4 && completed.has(index) ? styles.visited : ""}><span>{String(index + 1).padStart(2, "0")}</span><strong>{name}</strong><small>{index < 4 && completed.has(index) ? "Completed" : index === 4 && finished ? "Reached" : "Not yet reached"}</small></li>)}</ol></section>
      <section className={styles.timeline} aria-labelledby="timeline-heading"><div className={styles.sectionHead}><div><p>02 / REPRODUCIBLE EVIDENCE</p><h2 id="timeline-heading">What happened</h2></div></div>{events.length ? <ol>{events.map((event, index) => <li key={`${event.at}-${index}`}><span className={event.type === "blocked" ? styles.warning : styles.eventDot} /><div><strong>{eventNames[event.type]}</strong><p>{stageNames[event.step]}{event.detail ? ` · ${detailNames[event.detail] || event.detail}` : ""}</p></div><time dateTime={event.at}>{new Date(event.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</time></li>)}</ol> : <div className={styles.empty}><p>Finish the sample loan journey to see its local event trail here.</p><Link href="/apply">Start the sample journey →</Link></div>}</section>
      <section className={styles.audit}><div><p>THE ORIGINAL ACCESSPATH CAPABILITY</p><h2>Route evidence can go deeper.</h2><p>The existing audit follows an approved visitor goal and saves page-level accessibility findings. A Finance-specific lender view and consented analytics are the next integration step.</p></div><Link href="/audit">Explore the original audit ↗</Link></section>
    </div>
  </main>;
}
