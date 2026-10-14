import "server-only";
import { courtAdmin } from "@/lib/court";
import { nextCourtOpening, type DailyCourt } from "@/lib/daily-court";

export async function loadDailyCourt(): Promise<DailyCourt> {
  const now = new Date();
  const fallback: DailyCourt = {
    session: null,
    previous: null,
    nextOpensAt: nextCourtOpening(now),
    serverNow: now.toISOString(),
    available: false,
  };
  try {
    const admin = courtAdmin();
    const { data, error } = await admin.rpc("ensure_daily_court");
    if (error) return fallback;
    const session = data?.[0] || null;
    const { data: previous, error: previousError } = await admin
      .from("daily_court_sessions")
      .select("*")
      .lt("closes_at", now.toISOString())
      .order("closes_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (previousError) return fallback;
    return {
      ...fallback,
      session,
      previous: previous?.case_id === session?.case_id ? null : previous,
      available: true,
    };
  } catch {
    return fallback;
  }
}
