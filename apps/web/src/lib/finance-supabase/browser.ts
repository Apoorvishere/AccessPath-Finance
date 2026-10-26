import { createBrowserClient } from "@supabase/ssr";

export function createFinanceBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_FINANCE_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_FINANCE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Finance Supabase is not configured yet.");
  return createBrowserClient(url, key);
}
