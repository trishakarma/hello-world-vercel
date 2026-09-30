import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const cookieStore = await cookies();
  const nextCookie = cookieStore.get("auth_next")?.value;
  const next = safeNextPath(nextCookie ? decodeURIComponent(nextCookie) : "/");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();

        if (
          !profile?.first_name?.trim() ||
          !profile?.last_name?.trim()
        ) {
          const response = NextResponse.redirect(`${origin}/complete-profile`);
          response.cookies.delete("auth_next");
          return response;
        }
      }

      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.delete("auth_next");
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
