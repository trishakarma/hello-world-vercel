"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  nextPath?: string;
};

export function GoogleSignInButton({ nextPath = "/" }: Props) {
  async function signInWithGoogle() {
    const supabase = createSupabaseBrowserClient();
    if (nextPath && nextPath !== "/") {
      document.cookie = `auth_next=${encodeURIComponent(nextPath)}; path=/; max-age=600; samesite=lax`;
    }
    const redirectTo = `${window.location.origin}/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
  }

  return (
    <button
      type="button"
      onClick={() => void signInWithGoogle()}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
    >
      Continue with Google
    </button>
  );
}
