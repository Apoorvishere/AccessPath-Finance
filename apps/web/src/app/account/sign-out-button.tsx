"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFinanceBrowserSupabase } from "@/lib/finance-supabase/browser";
import styles from "./page.module.css";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const { error: authError } = await createFinanceBrowserSupabase().auth.signOut({ scope: "local" });
      if (authError) throw authError;
      router.replace("/"); router.refresh();
    } catch { setError("Could not sign out. Please try again."); setBusy(false); }
  }
  return <div className={styles.signOutWrap}><button type="button" onClick={signOut} disabled={busy}>{busy ? "Signing out…" : "Sign out ↗"}</button>{error && <span role="alert">{error}</span>}</div>;
}
