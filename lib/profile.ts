import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Profile } from "@/lib/supabase/types";

export function profileNeedsNames(profile: Pick<Profile, "first_name" | "last_name"> | null) {
  if (!profile) return true;
  return !profile.first_name?.trim() || !profile.last_name?.trim();
}

export async function getProfileForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return { profile: data, error };
}

export function displayName(profile: Pick<Profile, "first_name" | "last_name"> | null) {
  if (!profile) return "Member";
  const parts = [profile.first_name, profile.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Member";
}
