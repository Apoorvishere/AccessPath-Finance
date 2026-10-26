import Link from "next/link";
import styles from "../../site.module.css";

export default function FixedDemoContact() {
  return (
    <main className={styles.innerPage} id="main-content">
      <span className={styles.eyebrow}>NORTHSTAR / CORRECTED CONTACT</span>
      <h1>A clearer contact form.</h1>
      <p className={styles.intro}>This comparison page uses a visible label associated with every input. The form is still a demonstration and never sends data.</p>
      <div className={styles.contactGrid}>
        <section className={styles.formPanel} aria-labelledby="fixed-message-title">
          <span className={styles.cardNumber}>MESSAGE / CORRECTED FIXTURE</span>
          <h2 id="fixed-message-title">Tell us what you need.</h2>
          <form>
            <div className={styles.formField}>
              <label htmlFor="fixed-name">Your name</label>
              <input id="fixed-name" name="name" type="text" autoComplete="name" />
            </div>
            <div className={styles.formField}>
              <label htmlFor="fixed-email">Email address</label>
              <input id="fixed-email" name="email" type="email" autoComplete="email" />
            </div>
            <div className={styles.formField}>
              <label htmlFor="fixed-message">Your question</label>
              <textarea id="fixed-message" name="message" rows={4} />
            </div>
            <p className={styles.formNote}>Sample form. Please do not enter personal information.</p>
          </form>
        </section>
        <aside className={styles.aside}>
          <span className={styles.cardNumber}>BEFORE / AFTER</span>
          <h2>One small change, a clearer field.</h2>
          <p>The original sample displays “Email address” without associating it with the field. This version uses a visible, associated label.</p>
          <Link href="/demo-site/contact">View original sample <span aria-hidden="true">↗</span></Link>
        </aside>
      </div>
    </main>
  );
}
