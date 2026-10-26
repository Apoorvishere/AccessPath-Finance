import Link from "next/link";
import { redirect } from "next/navigation";
import { createFinanceServerSupabase, financeSupabaseConfigured } from "@/lib/finance-supabase/server";
import SignOutButton from "./sign-out-button";
import styles from "./page.module.css";


export default async function AccountPage() {
  if (!financeSupabaseConfigured()) return <main className={styles.page}><header className={styles.header}><Link href="/">accesspath <strong>finance.</strong></Link></header><section className={styles.panel}><p className={styles.kicker}>ACCOUNT / SETUP</p><h1>Finance accounts are being connected.</h1><p>The separate Supabase project has not been configured yet. The sample journey is available now without an account.</p><Link className={styles.primary} href="/apply">Try the sample journey →</Link></section></main>;
  const supabase = await createFinanceServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  return <main className={styles.page}><header className={styles.header}><Link href="/">accesspath <strong>finance.</strong></Link><SignOutButton /></header><section className={styles.panel}><p className={styles.kicker}>ACCESSPATH / YOUR ACCOUNT</p><h1>Welcome back.</h1><p className={styles.email}>{user.email}</p><p>You&apos;re signed in to AccessPath Finance. The loan walkthrough uses fictional data and keeps its progress in this browser; it does not store a loan application in your account.</p><div className={styles.actions}><Link className={styles.primary} href="/apply">Continue sample journey →</Link><Link className={styles.secondary} href="/insights">View local journey evidence ↗</Link></div></section><div className={styles.note}><span>ACCOUNT ACCESS</span><p>Supabase manages your sign-in session. Journey evidence shown here is local to this browser.</p></div></main>;
}
