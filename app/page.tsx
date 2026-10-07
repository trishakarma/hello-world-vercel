import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CourtRoom } from "@/app/components/court-room";
import type { Evidence } from "@/lib/supabase/types";

export default async function Home() {
  let loggedIn = false;
  let evidence: Evidence[] = [];
  let setupError = false;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    loggedIn = Boolean(user);
    const [
      { data: cases, error },
      { data: scores, error: scoreError },
      { data: captions, error: captionError },
      { data: votes },
    ] = await Promise.all([
      supabase
        .from("court_cases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase.rpc("court_scores"),
      supabase.from("captions").select("*"),
      user
        ? supabase
            .from("caption_votes")
            .select("caption_id,value")
            .eq("user_id", user.id)
        : Promise.resolve({ data: [] }),
    ]);
    setupError = Boolean(error || scoreError || captionError);
    evidence = await Promise.all(
      (cases || []).map(async (c) => {
        const { data } = await supabase.storage
          .from("court-evidence")
          .createSignedUrl(c.image_path, 3600);
        return {
          ...c,
          imageUrl: data?.signedUrl || "",
          captions: (captions || [])
            .filter((cap) => cap.case_id === c.id)
            .map((cap) => ({
              ...cap,
              score: Number(
                scores?.find((s) => s.caption_id === cap.id)?.score || 0,
              ),
              votes: Number(
                scores?.find((s) => s.caption_id === cap.id)?.votes || 0,
              ),
              myVote: votes?.find((v) => v.caption_id === cap.id)?.value || 0,
            })),
        };
      }),
    );
  } catch {
    setupError = true;
  }
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  }).format(new Date());
  const today = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    weekday,
  );
  return (
    <CourtRoom
      evidence={evidence}
      loggedIn={loggedIn}
      setupError={setupError}
      today={today}
    />
  );
}
