import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./site.module.css";

export const metadata: Metadata = {
  title: "Northstar Services | AccessPath demo",
  description: "A controlled public journey for demonstrating AccessPath accessibility checks.",
};

export default function DemoSiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.site}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/demo-site">
          <span className={styles.brandMark} aria-hidden="true">N<span>✦</span></span>
          <span>NORTHSTAR<span className={styles.brandSub}>SERVICES</span></span>
        </Link>
        <nav className={styles.nav} aria-label="Demo site navigation">
          <Link href="/demo-site">Home</Link>
          <Link href="/demo-site/support">Support</Link>
          <Link href="/demo-site/contact">Contact</Link>
        </nav>
      </header>
      {children}
      <footer className={styles.footer}>
        <span>NORTHSTAR SERVICES</span>
        <p>A fictional service created as a controlled AccessPath test fixture. No message is sent from these pages.</p>
        <Link href="/">Return to AccessPath ↗</Link>
      </footer>
    </div>
  );
}
