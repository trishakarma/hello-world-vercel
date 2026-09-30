import Link from "next/link";
import { redirect } from "next/navigation";

import { displayName, getProfileForUser } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MembersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/members");
  }

  const { profile } = await getProfileForUser(supabase, user.id);
  const name = displayName(profile);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
        Members only
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Welcome, {name}
      </h1>
      <p className="mt-4 text-neutral-600">
        This route is gated — you only see it when signed in. It extends the
        assignment #2 Supabase app with Google auth and profiles.
      </p>
      <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
        <p className="font-medium">You&apos;re authenticated</p>
        <p className="mt-1 break-all text-emerald-800/90">User id: {user.id}</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-4 text-sm font-medium">
        <Link href="/profile" className="underline underline-offset-4">
          Edit profile
        </Link>
        <Link href="/items" className="underline underline-offset-4">
          View public items
        </Link>
      </div>
    </main>
  );
}
