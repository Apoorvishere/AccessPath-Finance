import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Verified demo audit | AccessPath",
  description: "A real TinyFish Browser API and axe-core comparison of AccessPath's controlled contact-form fixture.",
};

const originalUrl = "https://access-path-mu.vercel.app/demo-site/contact";
const correctedUrl = "https://access-path-mu.vercel.app/demo-site/fixed/contact";

export default function DemoReportPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">A<span>P</span></span>
          <span>accesspath<span className={styles.period}>.</span></span>
        </Link>
        <span className={styles.headerMeta}>EVIDENCE / CONTROLLED DEMO</span>
        <Link className={styles.headerLink} href="/journeys/new">Create a journey <span aria-hidden="true">↗</span></Link>
      </header>

      <section className={styles.hero} aria-labelledby="report-title">
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>FIELD REPORT 001 / VERIFIED BROWSER AUDIT</span>
          <h1 id="report-title">One field.<br /><em>One clear barrier.</em></h1>
          <p>We audited two versions of the same contact form in a TinyFish browser session. The original email field lacked a programmatically associated label. The corrected version passed that rule.</p>
          <div className={styles.heroActions}>
            <a href="#finding" className={styles.primaryAction}>Review the finding <span aria-hidden="true">↘</span></a>
            <a href="#evidence" className={styles.textAction}>See page evidence <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <aside className={styles.resultCard} aria-label="Audit result summary">
          <div className={styles.resultCardHead}><span>RUN / 18 OCT 2026</span><span className={styles.liveDot}>ACTUAL SCAN</span></div>
          <div className={styles.resultMetric}><strong>01</strong><span>critical rule violation on the original contact page</span></div>
          <div className={styles.resultDivider} />
          <div className={styles.resultMetricSecondary}><strong>00</strong><span>rule violations recorded on the corrected contact page</span></div>
          <p>Both pages still had one check marked for human review. Zero recorded violations is not a conformance claim.</p>
        </aside>
      </section>

      <section className={styles.context} aria-labelledby="context-title">
        <div className={styles.sectionLabel}>01 / CONTEXT</div>
        <div>
          <h2 id="context-title">A result tied to<br /><em>the page that matters.</em></h2>
          <p>The target was a fictional Northstar Services contact form created for this test. The pages were opened directly in a TinyFish Browser API session and checked with Playwright and axe-core 4.14. This report is a saved audit snapshot, not a live scan triggered by this page.</p>
        </div>
        <div className={styles.contextFacts}>
          <div><span>TARGET</span><strong>Controlled public demo</strong></div>
          <div><span>CHECKED</span><strong>18 October 2026</strong></div>
          <div><span>ENGINE</span><strong>TinyFish Browser API + axe-core</strong></div>
          <div><span>SCOPE</span><strong>Original and corrected contact pages</strong></div>
        </div>
      </section>

      <section className={styles.finding} id="finding" aria-labelledby="finding-title">
        <div className={styles.findingTop}><span>02 / AUTOMATED FINDING</span><span>IMPACT / CRITICAL</span></div>
        <div className={styles.findingBody}>
          <div>
            <span className={styles.ruleTag}>AXE RULE / LABEL</span>
            <h2 id="finding-title">The email field has no associated label.</h2>
            <p>The original page displays “Email address” above the input, but that text is a separate element. The input has no accessible name that identifies its purpose. The corrected page uses a visible <code>&lt;label&gt;</code> linked to the field.</p>
            <a className={styles.externalLink} href="https://dequeuniversity.com/rules/axe/4.14/label" target="_blank" rel="noopener noreferrer">Read the rule explanation <span aria-hidden="true">↗</span></a>
          </div>
          <div className={styles.findingDetails}>
            <div><span>AFFECTED PAGE</span><a href={originalUrl} target="_blank" rel="noopener noreferrer">Northstar / Contact ↗</a></div>
            <div><span>AFFECTED ELEMENT</span><code>#demo-email</code></div>
            <div><span>RECORDED RESULT</span><strong>1 affected element</strong></div>
            <div><span>RECOMMENDED FIX</span><strong>Associate a visible label with the input.</strong></div>
          </div>
        </div>
      </section>

      <section className={styles.evidence} id="evidence" aria-labelledby="evidence-title">
        <div className={styles.evidenceHead}>
          <span className={styles.sectionLabel}>03 / EVIDENCE</span>
          <h2 id="evidence-title">Before, then <em>after.</em></h2>
          <p>Screenshots were captured in the same TinyFish browser session as the axe results. The visual difference alone does not establish the accessible-name result; the rule and affected selector above do.</p>
        </div>
        <div className={styles.comparison}>
          <article className={styles.comparisonCard}>
            <div className={styles.comparisonLabel}><span>01 / ORIGINAL</span><strong>1 label violation</strong></div>
            <div className={styles.imageFrame}><Image src="/evidence/contact.png" alt="Original Northstar contact form with email address text visually above the email field" width={1453} height={1404} sizes="(max-width: 850px) 100vw, 50vw" /></div>
            <a href={originalUrl} target="_blank" rel="noopener noreferrer">Open original page <span aria-hidden="true">↗</span></a>
          </article>
          <article className={styles.comparisonCard}>
            <div className={styles.comparisonLabel}><span>02 / CORRECTED</span><strong>0 label violations</strong></div>
            <div className={styles.imageFrame}><Image src="/evidence/corrected-contact.png" alt="Corrected Northstar contact form with a visible label associated with the email field" width={1453} height={1404} sizes="(max-width: 850px) 100vw, 50vw" /></div>
            <a href={correctedUrl} target="_blank" rel="noopener noreferrer">Open corrected page <span aria-hidden="true">↗</span></a>
          </article>
        </div>
      </section>

      <section className={styles.limits} aria-labelledby="limits-title">
        <span className={styles.sectionLabel}>04 / WHAT THIS MEANS</span>
        <h2 id="limits-title">Evidence with limits, <em>clearly stated.</em></h2>
        <div className={styles.limitsGrid}>
          <p>This run audited a controlled fixture. It proves that the browser audit can identify this specific label issue and distinguish the corrected page. The audit has not yet been connected to the journey studio or opened to arbitrary websites.</p>
          <p>Each contact page had one check requiring human review. Automated checks cover only part of accessibility evaluation; a person must still assess interaction, context, and overall usability.</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <Link href="/" className={styles.footerBrand}>accesspath<span>.</span></Link>
        <span>REAL BROWSER EVIDENCE / CONTROLLED DEMO</span>
        <Link href="/">Back to home ↑</Link>
      </footer>
    </main>
  );
}
