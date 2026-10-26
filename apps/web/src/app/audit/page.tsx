"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const routeSteps = [
  { title: "Home", meta: "Entry point", detail: "The visitor starts with a goal, not a sitemap.", state: "01 / visited" },
  { title: "Support", meta: "Navigation", detail: "The path reveals the pages encountered along the way.", state: "02 / visited" },
  { title: "Contact", meta: "Destination", detail: "The final page exposes an illustrative form-label issue.", state: "03 / 2 findings" },
];

const phases = [
  {
    number: "01",
    label: "INTENT",
    title: "Start with a real task.",
    text: "Give AccessPath a public URL and a goal such as finding a contact form. The scan stays bounded to a small public journey.",
    foot: "URL + visitor goal",
  },
  {
    number: "02",
    label: "EXPLORATION",
    title: "Trace the route taken.",
    text: "TinyFish explores the live site from that goal. AccessPath records the relevant pages rather than treating each URL in isolation.",
    foot: "TinyFish Web Agent",
  },
  {
    number: "03",
    label: "EVIDENCE",
    title: "Make each issue useful.",
    text: "Automated checks attach a rule, affected element, page, and visual context. Human-review items remain clearly identified.",
    foot: "Findings + review",
  },
];

const phaseClasses = [styles.phaseCard1, styles.phaseCard2, styles.phaseCard3];

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
}

export default function Home() {
  const [activeRoute, setActiveRoute] = useState(2);
  const selected = routeSteps[activeRoute];

  return (
    <main id="top" className={styles.page}>
      <header className={styles.siteHeader}>
        <a className={styles.brand} href="#top" aria-label="AccessPath home">
          <span className={styles.brandGlyph} aria-hidden="true">
            <svg viewBox="0 0 36 36" fill="none">
              <path d="M7 28V9h10c7 0 12 4 12 10s-5 9-11 9H7Z" stroke="currentColor" strokeWidth="2.4" />
              <path d="M13 22h7M13 16h7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </span>
          <span className={styles.brandText}>accesspath<span className={styles.brandPeriod}>.</span></span>
        </a>

        <nav className={styles.siteNav} aria-label="Primary navigation">
          <a href="#approach">Approach</a>
          <a href="#example-report">Report preview</a>
          <a href="#about">About</a>
          <a href="/dashboard">My workspace</a>
        </nav>

        <a className={styles.headerAction} href="/journeys/new">
          Create a journey <Arrow diagonal />
        </a>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroGrid}>
          <div className={styles.heroContent}>
            <div className={styles.overline}><span className={styles.overlineRule} /> ACCESSIBILITY, IN CONTEXT <span> / 2026</span></div>
            <h1 id="hero-title">Find what gets<br />in the <span>way.</span></h1>
            <p className={styles.heroLead}>
              Follow a visitor&apos;s goal across the live web. See where the journey
              becomes difficult, and bring evidence back to the people who can fix it.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#approach">See how it works <Arrow diagonal /></a>
              <a className={styles.secondaryAction} href="#example-report">View sample evidence <Arrow /></a>
            </div>
            <div className={styles.heroFootnote}>
              <span className={styles.footnoteLine} />
              <span>For product teams building more usable digital journeys.</span>
            </div>
          </div>

          <div className={styles.visualWrap}>
            <div className={styles.visualIndex} aria-hidden="true">AP / FIELD NOTE 001</div>
            <div className={styles.journeyPanel} aria-label="Interactive illustrative journey preview">
              <div className={styles.panelHead}>
                <span>JOURNEY RECORD</span>
                <span className={styles.panelStatus}><i /> ILLUSTRATIVE</span>
              </div>
              <div className={styles.panelGoal}>
                <span className={styles.panelLabel}>VISITOR INTENT</span>
                <strong>Find the contact form</strong>
                <span>example.org / public journey</span>
              </div>
              <div className={styles.routeList} role="group" aria-label="Preview journey steps">
                {routeSteps.map((step, index) => (
                  <button
                    className={`${styles.routeButton} ${activeRoute === index ? styles.routeButtonActive : ""}`}
                    key={step.title}
                    type="button"
                    aria-pressed={activeRoute === index}
                    onClick={() => setActiveRoute(index)}
                  >
                    <span className={styles.routeNumber}>0{index + 1}</span>
                    <span className={styles.routeName}><strong>{step.title}</strong><small>{step.meta}</small></span>
                    <span className={styles.routeState}>{step.state}</span>
                    <Arrow diagonal />
                  </button>
                ))}
              </div>
              <div className={styles.panelDetail} aria-live="polite">
                <span>SELECTED STEP / 0{activeRoute + 1}</span>
                <p>{selected.detail}</p>
              </div>
              <div className={styles.panelFoot}>Conceptual preview. No live scan is shown.</div>
            </div>
            <span className={styles.visualCaption}>A task. A route. A clearer next action.</span>
          </div>
        </div>
      </section>

      <section className={styles.approach} id="approach" aria-labelledby="approach-title">
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionIndex}>01 / THE APPROACH</span>
            <h2 id="approach-title">A better audit starts<br />with <em>where people go.</em></h2>
          </div>
          <p>
            A person experiences a sequence, not a list of URLs. AccessPath brings
            the goal, the route, and the findings into one account of what happened.
          </p>
        </div>
        <div className={styles.phaseGrid}>
          {phases.map((phase, index) => (
            <article className={`${styles.phaseCard} ${phaseClasses[index]}`} key={phase.number}>
              <div className={styles.phaseTop}><span>{phase.label}</span><span>{phase.number} / 03</span></div>
              <span className={styles.phaseNumber} aria-hidden="true">{phase.number}</span>
              <div className={styles.phaseCopy}><h3>{phase.title}</h3><p>{phase.text}</p></div>
              <div className={styles.phaseBottom}><span>{phase.foot}</span><Arrow diagonal /></div>
            </article>
          ))}
        </div>
        <p className={styles.approachNote}>Automated results identify some barriers. Human evaluation remains essential.</p>
      </section>

      <section className={styles.reportSection} id="example-report" aria-labelledby="report-title">
        <div className={styles.reportHeading}>
          <span className={styles.sectionIndex}>02 / REPORT PREVIEW</span>
          <h2 id="report-title">Evidence you can<br /><em>work from.</em></h2>
          <p>No mystery score. A useful report locates an issue within the task, names the check, and makes the next step clear.</p>
          <div className={styles.reportLegend}><span className={styles.legendSquare} /> Example data shown for layout only</div>
          <a className={styles.realReportLink} href="/reports/demo">View a verified demo audit <Arrow diagonal /></a>
        </div>
        <div className={styles.reportCanvas}>
          <div className={styles.reportCanvasHeader}>
            <span>ACCESSPATH / OBSERVATION 01</span>
            <span>EXAMPLE.ORG <Arrow diagonal /></span>
          </div>
          <div className={styles.reportCanvasBody}>
            <div className={styles.reportAside}>
              <span className={styles.reportAsideLabel}>JOURNEY</span>
              <strong>Home <span>→</span> Support <span>→</span> Contact</strong>
              <p>Goal: find the contact form</p>
              <div className={styles.reportPageMarker}>03 <span>/ CONTACT PAGE</span></div>
            </div>
            <div className={styles.reportFinding}>
              <div className={styles.findingTop}><span>ILLUSTRATIVE FINDING</span><span>RULE / LABEL</span></div>
              <h3>A form field has no accessible label.</h3>
              <p>The field&apos;s purpose may not be announced clearly to someone using assistive technology.</p>
              <div className={styles.findingElement}><span>AFFECTED ELEMENT</span><code>&lt;input type=&quot;email&quot; /&gt;</code></div>
              <div className={styles.findingAction}><span>RECOMMENDED NEXT STEP</span><strong>Add a visible label associated with the input.</strong></div>
            </div>
          </div>
          <div className={styles.reportCanvasFoot}><span>Automated observation + human review</span><span>PREVIEW / NOT A LIVE SCAN</span></div>
        </div>
      </section>

      <footer className={styles.footer} id="about">
        <div className={styles.footerTop}>
          <div className={styles.footerStatement}>
            <span className={styles.sectionIndex}>ACCESSPATH / ORIGINAL AUDIT</span>
            <h2>Make the path<br /><em>possible for more people.</em></h2>
            <p>Journey-based accessibility evidence for teams that want to build more usable websites.</p>
          </div>
          <div className={styles.footerColumns}>
            <div><h3>Explore</h3><Link href="/">Finance demo</Link><a href="#top">Home</a><a href="#approach">Our approach</a><a href="#example-report">Report preview</a></div>
            <div><h3>Project</h3><a href="https://github.com/Apoorvishere/AccessPath" target="_blank" rel="noopener noreferrer">GitHub repository ↗</a><span>License to be selected</span><span>Privacy policy in preparation</span></div>
            <div><h3>Contact</h3><span>Team contact will be published with the repository.</span><span>USAR, GGSIPU East Delhi Campus</span></div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <a className={styles.footerBrand} href="#top">accesspath<span>.</span></a>
          <p>© 2026 AccessPath. Automated checks do not establish full accessibility conformance.</p>
          <a href="#top" className={styles.backToTop}>Back to top ↑</a>
        </div>
      </footer>
    </main>
  );
}
