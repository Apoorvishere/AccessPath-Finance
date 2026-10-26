import Link from "next/link";
import styles from "../site.module.css";

export default function DemoSupport() {
  return (
    <main className={styles.innerPage} id="main-content">
      <span className={styles.eyebrow}>NORTHSTAR / SUPPORT</span>
      <h1>How can we help?</h1>
      <p className={styles.intro}>Choose the next step that matches your question. Our contact page includes a short message form and other ways to reach the team.</p>
      <div className={styles.supportGrid}>
        <article className={styles.supportCard}>
          <span className={styles.cardNumber}>01 / GENERAL QUESTIONS</span>
          <h2>Get in touch</h2>
          <p>For questions about our services, find the contact form and send a note when you are ready.</p>
          <Link href="/demo-site/contact">Go to contact <span aria-hidden="true">↗</span></Link>
        </article>
        <article className={styles.supportCard}>
          <span className={styles.cardNumber}>02 / GUIDANCE</span>
          <h2>Know where to start</h2>
          <p>Not sure what to ask? Our team can point you to the right information.</p>
          <Link href="/demo-site/contact">Contact the team <span aria-hidden="true">↗</span></Link>
        </article>
      </div>
    </main>
  );
}
