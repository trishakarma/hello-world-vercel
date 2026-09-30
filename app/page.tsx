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
      <h1 className="text-4xl font-semibold tracking-tight">
        {isLoggedIn ? "Hello, you're signed in!" : "Welcome"}
      </h1>
      <p className="mt-4 text-lg text-neutral-600">
        {isLoggedIn ? "Congratulations!" : "Sign in with Google to get started."}
      </p>
      <Link
        href={isLoggedIn ? "/profile" : "/login"}
        className="mt-8 inline-flex w-fit items-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
      >
        {isLoggedIn ? "Your profile" : "Sign in with Google"}
      </Link>
    </main>
  );
}
