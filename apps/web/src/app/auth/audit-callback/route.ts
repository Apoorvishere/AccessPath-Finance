import { NextResponse } from "next/server";
import { createServerSupabase, supabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  if (!supabaseConfigured()) return NextResponse.redirect(`${origin}/audit/login?error=config`);
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/audit/login?error=callback`);
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/audit/login?error=callback`);
  return NextResponse.redirect(`${origin}/dashboard`);
}
