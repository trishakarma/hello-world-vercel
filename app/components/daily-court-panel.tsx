"use client";

import Image from "next/image";
import Link from "next/link";
import {
  countdownParts,
  winningCaptions,
  type DailyCourt,
} from "@/lib/daily-court";
import type { Evidence } from "@/lib/supabase/types";

type Props = {
  dailyCourt: DailyCourt;
  evidence: Evidence[];
  clock: number;
  loggedIn: boolean;
  myVotes: Record<string, number>;
  voting: string | null;
  onVote: (captionId: string, value: number, oldVote: number) => Promise<void>;
};
export function DailyCourtPanel({
  dailyCourt,
  evidence,
  clock,
  loggedIn,
  myVotes,
  voting,
  onVote,
}: Props) {
  const { session, previous } = dailyCourt;
  const featured = evidence.find((c) => c.id === session?.case_id);
  const yesterday = evidence.find((c) => c.id === previous?.case_id);
  const closingTime =
    session?.closes_at ||
    new Date(
      Date.parse(dailyCourt.nextOpensAt) - 4 * 60 * 60 * 1000,
    ).toISOString();
  const closed = clock >= Date.parse(closingTime);
  const countdown = countdownParts(
    !closed ? closingTime : dailyCourt.nextOpensAt,
    clock,
  );
  const resultReady = Boolean(
    closed &&
      session &&
      Date.parse(dailyCourt.serverNow) >= Date.parse(session.closes_at),
  );
  const winners =
    resultReady && featured ? winningCaptions(featured.captions) : [];
  const participated = featured?.captions.some(
    (c) => (myVotes[c.id] ?? c.myVote) !== 0,
  );
  const backedWinner = winners.some((c) => (myVotes[c.id] ?? c.myVote) === 1);
  const pastWinners = yesterday ? winningCaptions(yesterday.captions) : [];
  return (
    <section
      id="daily-court"
      className="daily-court-panel"
      aria-labelledby="daily-court-title"
    >
      <div className="daily-court-heading">
        <div>
          <p className="eyebrow">ONE CASE. ONE DAY. A FINAL RULING.</p>
          <h2 id="daily-court-title">
            Daily Court{" "}
            <span>
              {closed
                ? "ADJOURNED"
                : featured
                  ? "IN SESSION"
                  : "AWAITING EVIDENCE"}
            </span>
          </h2>
        </div>
        <div
          className="court-countdown"
          role="timer"
          aria-live="off"
          aria-label={`${closed ? "Next session opens" : "Verdicts close"} in ${countdown.hours} hours ${countdown.minutes} minutes ${countdown.seconds} seconds`}
        >
          <span>
            {closed ? "NEXT SESSION · MIDNIGHT ET" : "VERDICTS CLOSE · 8 PM ET"}
          </span>
          <strong>
            {countdown.hours}
            <i>:</i>
            {countdown.minutes}
            <i>:</i>
            {countdown.seconds}
          </strong>
        </div>
      </div>
      {!dailyCourt.available ? (
        <div className="daily-court-empty">
          <h3>The daily courtroom is being prepared.</h3>
          <p>
            The clerk needs to connect the Daily Court schedule. You can still
            judge the ordinary docket below.
          </p>
        </div>
      ) : !featured ? (
        <div className="daily-court-empty">
          <span>§</span>
          <h3>
            {closed
              ? "Court is adjourned for the night."
              : "The jury needs a new case."}
          </h3>
          <p>
            {closed
              ? "The next daily case opens at midnight New York time. Come back to take your jury seat."
              : "Upload fresh photo evidence to help stock the next session. Daily Court runs from midnight to 8 p.m. New York time."}
          </p>
          <a href="#docket" className="text-link">
            Explore the open docket ↓
          </a>
        </div>
      ) : (
        <div className="daily-case-layout">
          <div className="daily-evidence">
            <div className="daily-photo">
              {featured.imageUrl ? (
                <Image
                  src={featured.imageUrl}
                  alt={featured.description || "Daily photo evidence"}
                  fill
                  unoptimized
                  sizes="(max-width: 760px) 100vw, 45vw"
                />
              ) : (
                <p>Photo unavailable. Refresh to retry.</p>
              )}
              <span className="photo-label">
                {closed ? "THE JURY HAS SPOKEN" : "TODAY’S FEATURED EVIDENCE"}
              </span>
            </div>
            <p className="daily-case-date">
              {new Intl.DateTimeFormat("en-US", {
                timeZone: "America/New_York",
                month: "long",
                day: "numeric",
              }).format(new Date(session!.opens_at))}{" "}
              · {featured.theme}
            </p>
          </div>
          <div className="daily-arguments">
            {closed && !resultReady ? (
              <div className="ruling-reveal">
                <p className="eyebrow">VOTING IS CLOSED</p>
                <h3>Counting the final verdict…</h3>
                <p>The ruling will appear in a moment.</p>
              </div>
            ) : closed ? (
              <div className="ruling-reveal">
                <p className="eyebrow">THE JURY HAS SPOKEN</p>
                <h3>
                  {winners.length > 1
                    ? "A split verdict."
                    : winners.length
                      ? "Comedy gold. Case closed."
                      : "No verdict this time."}
                </h3>
                {winners.length ? (
                  winners.map((c) => (
                    <blockquote key={c.id}>
                      {c.content}
                      <span>
                        Final score {c.score > 0 ? "+" : ""}
                        {c.score}
                      </span>
                    </blockquote>
                  ))
                ) : (
                  <p>
                    No votes were cast. Tomorrow brings another chance to judge.
                  </p>
                )}
                {loggedIn && participated && (
                  <p className="juror-result">
                    {backedWinner
                      ? "You backed the winning caption. Good judgment, juror."
                      : "Your verdict is on record. The jury went another way."}
                  </p>
                )}
                <p className="return-hook">
                  The next session opens at midnight. Come back for fresh
                  evidence.
                </p>
              </div>
            ) : (
              <>
                <p className="daily-instructions">
                  Three captions take the stand. Deliver your verdict before 8
                  p.m., then return for the ruling.
                </p>
                {featured.captions.map((c, i) => {
                  const selected = myVotes[c.id] ?? c.myVote;
                  return (
                    <div className="daily-caption" key={c.id}>
                      <span className="caption-number">0{i + 1}</span>
                      <p>{c.content}</p>
                      <div className="verdict-row">
                        {loggedIn ? (
                          <>
                            <button
                              className={
                                selected === 1
                                  ? "vote-positive selected"
                                  : "vote-positive"
                              }
                              disabled={voting !== null}
                              aria-pressed={selected === 1}
                              onClick={() => onVote(c.id, 1, c.myVote)}
                            >
                              ✦ Comedy gold
                            </button>
                            <button
                              className={
                                selected === -1
                                  ? "vote-negative selected"
                                  : "vote-negative"
                              }
                              disabled={voting !== null}
                              aria-pressed={selected === -1}
                              onClick={() => onVote(c.id, -1, c.myVote)}
                            >
                              ↓ Not guilty of funny
                            </button>
                          </>
                        ) : (
                          <Link
                            className="jury-login"
                            href="/login?next=/#daily-court"
                          >
                            Sign in to join today’s jury ↗
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
                {participated && (
                  <p className="juror-result">
                    Your verdict is recorded. Come back after 8 p.m. to see
                    which caption wins.
                  </p>
                )}
                <p className="sealed-scores">
                  The ruling will be revealed when court closes. Verdicts can be
                  changed until then.
                </p>
              </>
            )}
          </div>
        </div>
      )}
      {yesterday && (
        <details className="previous-ruling">
          <summary>Previous ruling · {previous!.session_date}</summary>
          {pastWinners.length ? (
            pastWinners.map((c) => (
              <p key={c.id}>
                <strong>
                  {pastWinners.length > 1 ? "Joint winner" : "Winning caption"}
                </strong>{" "}
                · {c.content}{" "}
                <span>
                  ({c.score > 0 ? "+" : ""}
                  {c.score})
                </span>
              </p>
            ))
          ) : (
            <p>
              The last session closed without votes. The next jury gets a fresh
              start.
            </p>
          )}
        </details>
      )}
    </section>
  );
}
