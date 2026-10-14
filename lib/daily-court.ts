import type { Evidence } from "@/lib/supabase/types";

export type DailySession = {
  session_date: string;
  case_id: string;
  opens_at: string;
  closes_at: string;
};
export type DailyCourt = {
  session: DailySession | null;
  previous: DailySession | null;
  nextOpensAt: string;
  serverNow: string;
  available: boolean;
};

// Find the next NY midnight by searching UTC hours, handling 23/25-hour DST days.
export function nextCourtOpening(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  for (let i = 0; i < 26; i++) {
    next.setUTCHours(next.getUTCHours() + 1);
    if (parts.format(next) === "00:00") return next.toISOString();
  }
  throw new Error("Could not determine the next court opening");
}
export function countdownParts(deadline: string, now: number) {
  const seconds = Math.max(0, Math.ceil((Date.parse(deadline) - now) / 1000));
  return {
    hours: String(Math.floor(seconds / 3600)).padStart(2, "0"),
    minutes: String(Math.floor((seconds % 3600) / 60)).padStart(2, "0"),
    seconds: String(seconds % 60).padStart(2, "0"),
  };
}
export function winningCaptions(captions: Evidence["captions"]) {
  if (!captions.length || !captions.some((c) => c.votes > 0)) return [];
  const best = Math.max(...captions.map((c) => c.score));
  return captions.filter((c) => c.score === best);
}
