import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  let isLoggedIn = false;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = Boolean(user);
  } catch {
    // Supabase env not configured locally.
  }

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        Hello World Vercel
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Hello World</h1>
      <p className="mt-4 max-w-xl text-lg text-neutral-600">
        This app is connected to Supabase with Google sign-in, user profiles,
        and a members-only route.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/items"
          className="inline-flex w-fit items-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          View items from Supabase
        </Link>
        {isLoggedIn ? (
          <Link
            href="/members"
            className="inline-flex w-fit items-center rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium transition hover:bg-neutral-50"
          >
            Members area
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex w-fit items-center rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium transition hover:bg-neutral-50"
          >
            Sign in to unlock members area
          </Link>
        )}
      </div>
    </main>
  );
}
