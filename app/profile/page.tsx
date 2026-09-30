import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/app/components/profile-form";
import { getProfileForUser } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const { profile, error } = await getProfileForUser(supabase, user.id);

  if (error || !profile) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-4 text-red-700">
          {error?.message ??
            "Profile not found. Run supabase/profiles.sql in your Supabase project."}
        </p>
        <Link href="/" className="mt-6 inline-block underline">
          Back home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        Account
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-neutral-600">
        Update your name and photo. Images are stored in Supabase Storage.
      </p>
      <div className="mt-10">
        <ProfileForm profile={profile} userEmail={user.email ?? null} />
      </div>
    </main>
  );
}
