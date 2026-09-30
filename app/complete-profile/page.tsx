import { redirect } from "next/navigation";

import { CompleteProfileForm } from "@/app/components/complete-profile-form";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileNeedsNames(profile)) {
    redirect("/");
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
        <CompleteProfileForm />
      </div>
    </main>
  );
}
