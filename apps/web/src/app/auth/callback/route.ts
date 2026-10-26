import { NextResponse } from "next/server";
import { createFinanceServerSupabase, financeSupabaseConfigured } from "@/lib/finance-supabase/server";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  if (!financeSupabaseConfigured()) return NextResponse.redirect(`${origin}/login?error=config`);
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/login?error=callback`);
  const supabase = await createFinanceServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=callback`);
  return NextResponse.redirect(`${origin}/account`);
}
