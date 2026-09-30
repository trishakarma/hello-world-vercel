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
      <h1 className="text-3xl font-semibold tracking-tight">
        Hello, {name}, you&apos;re signed in!
      </h1>
      <p className="mt-4 text-lg text-neutral-600">Congratulations!</p>
      <Link href="/profile" className="mt-8 inline-block underline underline-offset-4">
        Edit profile
      </Link>
    </main>
  );
}
