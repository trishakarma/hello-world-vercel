import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { displayName, getProfileForUser } from "@/lib/profile";

import { SignOutButton } from "./sign-out-button";

export async function SiteHeader() {
  let userEmail: string | null = null;
  let nameLabel: string | null = null;
  let isLoggedIn = false;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      isLoggedIn = true;
      userEmail = user.email ?? null;
      const { profile } = await getProfileForUser(supabase, user.id);
      nameLabel = displayName(profile);
    }
  } catch {
    // Env not configured — header still renders public links.
  }

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Home
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
          {isLoggedIn ? (
            <>
              <Link
                href="/members"
                className="text-neutral-600 hover:text-neutral-900"
              >
                Members
              </Link>
              <Link
                href="/profile"
                className="text-neutral-600 hover:text-neutral-900"
              >
                Profile
              </Link>
              <span className="hidden text-neutral-500 sm:inline">
                {nameLabel}
                {userEmail ? ` · ${userEmail}` : ""}
              </span>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-black px-4 py-1.5 text-white hover:bg-neutral-800"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
