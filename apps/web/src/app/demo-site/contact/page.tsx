import Link from "next/link";
import styles from "../site.module.css";

export default function DemoContact() {
  return (
    <main className={styles.innerPage} id="main-content">
      <span className={styles.eyebrow}>NORTHSTAR / CONTACT</span>
      <h1>Reach the team.</h1>
      <p className={styles.intro}>Use this sample form to see the contact step of the journey. This is a demonstration, so the form never sends data.</p>
      <div className={styles.contactGrid}>
        <section className={styles.formPanel} aria-labelledby="message-title">
          <span className={styles.cardNumber}>MESSAGE / DEMO ONLY</span>
          <h2 id="message-title">Tell us what you need.</h2>
          <form>
            <div className={styles.formField}>
              <label htmlFor="demo-name">Your name</label>
              <input id="demo-name" name="name" type="text" autoComplete="name" />
            </div>
            <div className={styles.formField}>
              {/* Intentional fixture: visible text is not programmatically associated with this field. */}
              <span className={styles.orphanLabel}>Email address</span>
              <input id="demo-email" name="email" type="email" autoComplete="email" />
            </div>
            <div className={styles.formField}>
              <label htmlFor="demo-message">Your question</label>
              <textarea id="demo-message" name="message" rows={4} />
            </div>
            <p className={styles.formNote}>Sample form. Please do not enter personal information.</p>
          </form>
        </section>
        <aside className={styles.aside}>
          <span className={styles.cardNumber}>ALTERNATIVE ROUTE</span>
          <h2>More ways to connect.</h2>
          <p>For a real service, this space would include a support address and operating hours.</p>
          <Link href="/demo-site/support">Back to support <span aria-hidden="true">↗</span></Link>
        </aside>
      </div>
    </main>
  );
}
