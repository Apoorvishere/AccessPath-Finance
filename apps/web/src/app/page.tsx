import Link from "next/link";
import styles from "./page.module.css";

const features = [
  { number: "01", title: "Understand first", text: "See the steps, required details and loan terms before filling a long form." },
  { number: "02", title: "Confirm, don't retype", text: "Review suggested fields from a sample document. You decide what enters the application." },
  { number: "03", title: "Finish with confidence", text: "Get plain-language help, save progress and review the cost before submitting." },
];

const journeySteps = ["Need", "Document", "Review", "Cost", "Done"];

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="AccessPath Finance home">
          <span className={styles.brandMark}>A<span>.</span></span>
          <span>accesspath <strong>finance</strong></span>
        </Link>
        <nav aria-label="Primary navigation" className={styles.nav}>
          <a href="#approach">Approach</a>
          <a href="#evidence">Evidence</a>
          <a href="#demo">Demo</a>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className={styles.headerActions}><Link href="/login" className={styles.authLink}>Sign in</Link><Link href="/apply" className={styles.headerCta}>Try the demo <span aria-hidden="true">↗</span></Link></div>
      </header>

      <section className={styles.hero} aria-labelledby="hero-heading">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span /> PERSONAL LOANS, MADE CLEARER</p>
          <h1 id="hero-heading">A financial journey<br />you can <em>finish.</em></h1>
          <p className={styles.lead}>AccessPath Finance guides people through a loan application in plain language, with clear costs and a chance to review every detail.</p>
          <div className={styles.heroActions}>
            <Link href="/apply" className={styles.primary}>Try a sample journey <span aria-hidden="true">→</span></Link>
            <a href="#approach" className={styles.secondary}>See the approach <span aria-hidden="true">↘</span></a>
          </div>
          <p className={styles.demoNote}>Interactive concept using synthetic data. No real loan application is submitted.</p>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.demoWindow}>
            <div className={styles.windowTop}><span>ACCESSPATH / LIVE JOURNEY</span><span className={styles.liveDot}>● DEMO</span></div>
            <div className={styles.windowBody}>
              <span className={styles.windowKicker}>§01 · UNDERSTAND THE LOAN</span>
              <h2>Know the cost.<br /><em>Make the call.</em></h2>
              <p>A ₹30,000 example, over 12 months. The decision stays with you.</p>
              <div className={styles.moneyPanel}><span>ESTIMATED MONTHLY PAYMENT</span><strong>₹2,750.40</strong><small>Illustrative · 18% annual interest</small></div>
              <div className={styles.windowStats}><div><span>PROCESSING FEE</span><strong>₹600</strong></div><div><span>TOTAL INCLUDING FEE</span><strong>₹33,604.80</strong></div></div>
              <div className={styles.windowPrompt}><span>✦ SARVAM AI</span><p>“Is 18% the APR?”</p><small>Ask. Understand. Then decide.</small></div>
            </div>
            <div className={styles.windowBottom}><span>01 / 05 STEPS</span><span>FICTIONAL DEMO →</span></div>
          </div>
        </div>
      </section>

      <section className={styles.problem} id="approach" aria-labelledby="approach-heading">
        <div className={styles.sectionIntro}><p className={styles.index}>01 / THE APPROACH</p><h2 id="approach-heading">Less uncertainty at each step.</h2><p>A customer should know what is being asked, why it matters and what happens next.</p></div>
        <div className={styles.featureGrid}>{features.map((feature) => <article key={feature.number} className={styles.feature}><span>{feature.number}</span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
        <div className={styles.approachFoot}><span>GUIDE → CONFIRM → UNDERSTAND</span><p>AI helps explain and extract; the customer reviews every suggested field. The repayment calculation stays deterministic.</p></div>
      </section>

      <section className={styles.evidence} id="evidence" aria-labelledby="evidence-heading">
        <div className={styles.evidenceIntro}><p className={styles.index}>02 / JOURNEY EVIDENCE</p><h2 id="evidence-heading">See where confidence<br /><em>breaks down.</em></h2><p>The demo records step completion and recovery in this browser. It does not put the customer&apos;s name, income, document content or loan amount in those events.</p><div className={styles.evidenceLinks}><Link href="/insights">View journey evidence <span aria-hidden="true">↗</span></Link><Link href="/audit">Explore route audit <span aria-hidden="true">↗</span></Link></div></div>
        <div className={styles.evidencePanel} aria-label="Five-stage sample journey"><div className={styles.evidencePanelTop}><span>ACCESSPATH / JOURNEY MAP</span><span>LOCAL DEMO</span></div><div className={styles.evidenceRoute}>{journeySteps.map((step, index) => <div key={step}><span>0{index + 1}</span><strong>{step}</strong><i aria-hidden="true">↗</i></div>)}</div><p>Find the step, understand the friction, improve the route.</p></div>
      </section>

      <section className={styles.demoSection} id="demo" aria-labelledby="demo-heading"><div><p className={styles.index}>03 / TRY THE DEMO</p><h2 id="demo-heading">Go from a question<br />to a <em>clear decision.</em></h2><p>Walk through a fictional ₹30,000 personal loan. Review a sample payslip, inspect every suggested field, ask about terms, and check the full repayment cost before a sample submission.</p><div className={styles.demoActions}><Link href="/apply">Start the sample journey <span aria-hidden="true">→</span></Link><Link href="/login">Sign in to AccessPath <span aria-hidden="true">↗</span></Link></div><small>No lender receives this application. Account sign-in is separate from the sample loan journey.</small></div><div className={styles.demoMetrics}><div><span>01</span><strong>Fictional document</strong><p>Review every AI-suggested field.</p></div><div><span>02</span><strong>Clear cost</strong><p>See instalments and fees together.</p></div><div><span>03</span><strong>Local progress</strong><p>Continue where this browser left off.</p></div></div></section>

      <section className={styles.contactTeaser} aria-labelledby="contact-teaser-heading"><p className={styles.index}>04 / CONTACT</p><h2 id="contact-teaser-heading">Building a clearer financial journey?</h2><p>Talk to the AccessPath team about a lender pilot, the hackathon demo, or the underlying route audit.</p><Link href="/contact">Get in touch <span aria-hidden="true">↗</span></Link></section>
      <footer className={styles.footer}><span>accesspath finance.</span><p>Sample experience only. Loan figures are illustrative; no lending decision or financial advice is provided.</p><Link href="/contact">Contact ↗</Link></footer>
    </main>
  );
}
