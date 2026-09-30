import { redirect } from "next/navigation";

import { ProfileForm } from "@/app/components/profile-form";
import { profileNeedsNames } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CompleteProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!error && !profile) {
    const result = await supabase
      .from("profiles")
      .insert({ id: user.id })
      .select("*")
      .single();
    profile = result.data;
    error = result.error;
  }

  if (error || !profile) {
    console.error("Profile initialization failed", error?.code, error?.message);
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Profile unavailable</h1>
        <p className="mt-4 text-neutral-600">
          You are signed in, but we could not load your profile. Please try again
          after the profile database setup has been checked.
        </p>
      </main>
    );
  }

  if (!profileNeedsNames(profile)) {
    redirect("/members");
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        One more step
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Complete your profile
      </h1>
      <div className="mt-8">
        <ProfileForm profile={profile} userEmail={user.email ?? null} />
      </div>
    </main>
  );
}
