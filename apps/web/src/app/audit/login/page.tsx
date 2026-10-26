"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !configured) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const supabase = createBrowserSupabase();
      if (mode === "sign-in") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        router.replace("/dashboard");
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: `${window.location.origin}/auth/audit-callback` },
        });
        if (authError) throw authError;
        if (data.session) router.replace("/dashboard");
        else setMessage("Check your email for the confirmation link, then return to sign in.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in did not finish. Try again.");
    } finally { setBusy(false); }
  }

  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.brand}>accesspath<span>.</span></Link><Link href="/">Back to home ↗</Link></header>
    <div className={styles.layout}>
      <section className={styles.intro}>
        <span className={styles.eyebrow}>ACCESSPATH / YOUR WORKSPACE</span>
        <h1>Evidence worth<br /><em>keeping.</em></h1>
        <p>Sign in to save the controlled audit to your own workspace. Your reports are visible only to your account.</p>
        <div className={styles.steps}><span>01 / ACCOUNT</span><span>02 / SAVED EVIDENCE</span><span>03 / LIVE SCANS NEXT</span></div>
      </section>
      <section className={styles.formPanel} aria-labelledby="auth-title">
        <div className={styles.topline}><span>IDENTITY / 001</span><span>PRIVATE WORKSPACE</span></div>
        <div className={styles.formBody}>
          <div className={styles.tabs} role="group" aria-label="Choose authentication mode">
            <button type="button" aria-pressed={mode === "sign-in"} onClick={() => { setMode("sign-in"); setError(""); setMessage(""); }}>Sign in</button>
            <button type="button" aria-pressed={mode === "sign-up"} onClick={() => { setMode("sign-up"); setError(""); setMessage(""); }}>Create account</button>
          </div>
          <h2 id="auth-title">{mode === "sign-in" ? "Welcome back." : "Create your account."}</h2>
          <p>{mode === "sign-in" ? "Open your saved evidence and continue the work." : "Use an email address you can confirm."}</p>
          {!configured && <p className={styles.notice} role="status">Sign-in is waiting for the Supabase project settings.</p>}
          <form onSubmit={submit}>
            <label>EMAIL ADDRESS<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} disabled={busy || !configured} placeholder="you@example.com" /></label>
            <label>PASSWORD<input type="password" required minLength={8} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} disabled={busy || !configured} placeholder="At least 8 characters" /></label>
            <button className={styles.submit} type="submit" disabled={busy || !configured}><span>{busy ? "Working…" : mode === "sign-in" ? "Sign in" : "Create account"}</span><span aria-hidden="true">↗</span></button>
          </form>
          {error && <p className={styles.error} role="alert">{error}</p>}
          {message && <p className={styles.success} role="status">{message}</p>}
          <p className={styles.footnote}>AccessPath uses Supabase Auth for accounts. The private TinyFish preview code is separate and is never used as your password.</p>
        </div>
      </section>
    </div>
  </main>;
}
