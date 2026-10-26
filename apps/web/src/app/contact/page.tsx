import Link from "next/link";
import styles from "./page.module.css";

const people = [
  { name: "Apoorv Jha", role: "Lead developer", email: "apoorvkjha@outlook.com", number: "01" },
  { name: "Sanskaar Sharma", role: "Co-developer", email: "sanskaarsharma916@gmail.com", number: "02" },
];

export default function ContactPage() {
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.brand}>accesspath <strong>finance.</strong></Link><nav aria-label="Contact page navigation"><Link href="/#approach">Approach</Link><Link href="/#evidence">Evidence</Link><Link href="/#demo">Demo</Link><Link href="/login">Sign in</Link></nav><Link className={styles.back} href="/">Back to home ↗</Link></header>
    <section className={styles.hero}><div><p className={styles.kicker}>ACCESSPATH FINANCE / CONTACT</p><h1>Let&apos;s make the next<br /><em>step clearer.</em></h1><p>For the Paytm AI Hackathon, lender pilots, and questions about the guided loan journey, reach the people building it.</p></div><span className={styles.heroMark} aria-hidden="true">A<span>.</span></span></section>
    <section className={styles.team} aria-labelledby="team-heading"><div className={styles.sectionHead}><p className={styles.kicker}>01 / THE TEAM</p><h2 id="team-heading">Team Amrtisari Naan.</h2><p>Two developers working on a more understandable customer journey and clearer route evidence.</p></div><div className={styles.people}>{people.map(person => <article className={styles.person} key={person.email}><span className={styles.number}>{person.number} / TEAM</span><h3>{person.name}</h3><p>{person.role}</p><a href={`mailto:${person.email}`}>{person.email} <span aria-hidden="true">↗</span></a></article>)}</div></section>
    <section className={styles.connect} aria-labelledby="connect-heading"><div><p className={styles.kicker}>02 / CONNECT</p><h2 id="connect-heading">Follow the work.</h2><p>Our GitHub and LinkedIn QR cards will appear here when the team shares them. For now, email either team member directly.</p><Link href="/apply">Explore the sample journey <span aria-hidden="true">→</span></Link></div><div className={styles.qrGrid}><div className={styles.qrCard}><span>GITHUB / QR</span><div className={styles.qrPlaceholder} aria-hidden="true">↗</div><strong>QR to be added</strong><small>Team will provide the code.</small></div><div className={styles.qrCard}><span>LINKEDIN / QR</span><div className={styles.qrPlaceholder} aria-hidden="true">↗</div><strong>QR to be added</strong><small>Team will provide the code.</small></div></div></section>
    <footer className={styles.footer}><span>accesspath finance.</span><p>Built by Team Amrtisari Naan.</p><Link href="/">Back to top ↗</Link></footer>
  </main>;
}
