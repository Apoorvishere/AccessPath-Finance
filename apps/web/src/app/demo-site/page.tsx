import Link from "next/link";
import styles from "./site.module.css";

export default function DemoHome() {
  return (
    <main id="main-content">
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.eyebrow}>A CLEARER WAY FORWARD / 001</span>
          <h1>Practical help, <em>right when you need it.</em></h1>
          <p>Northstar Services is a fictional public service. Explore our support pages to find the right way to contact the team.</p>
          <Link className={styles.primaryLink} href="/demo-site/support">Find support <span aria-hidden="true">↗</span></Link>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <span className={styles.orbitOne} /><span className={styles.orbitTwo} /><span className={styles.star}>✦</span>
          <span className={styles.artCaption}>NORTH / 01</span>
        </div>
      </section>
      <section className={styles.homeLower} aria-labelledby="how-title">
        <span className={styles.eyebrow}>WHAT YOU CAN DO HERE</span>
        <h2 id="how-title">Start with a question. Leave with a route.</h2>
        <p>Find the support hub, review the contact options, and reach the team without creating an account.</p>
        <Link className={styles.textLink} href="/demo-site/support">Explore the support hub <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
