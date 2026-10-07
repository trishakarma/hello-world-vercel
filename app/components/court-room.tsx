"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Evidence } from "@/lib/supabase/types";

const themes = ["Campus chaos", "NYC side quest", "Anything goes"];
const prompts = [
  "A meal that deserves a hearing",
  "Only in New York",
  "The dorm-life defense",
  "Caught on the commute",
  "A suspiciously academic situation",
  "Weekend side-quest evidence",
  "The city’s most unserious moment",
];

export function CourtRoom({
  evidence,
  loggedIn,
  setupError,
  today,
}: {
  evidence: Evidence[];
  loggedIn: boolean;
  setupError: boolean;
  today: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("Docket");
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [theme, setTheme] = useState(themes[0]);
  const [context, setContext] = useState("");
  const [pending, setPending] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newCase, setNewCase] = useState("");
  const [myVotes, setMyVotes] = useState<Record<string, number>>({});
  const [scoreChanges, setScoreChanges] = useState<Record<string, number>>({});
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const sorted = [...evidence].sort((a, b) =>
    tab === "Hall of Fame"
      ? Math.max(
          ...b.captions.map((c) => c.score + (scoreChanges[c.id] || 0)),
        ) -
        Math.max(...a.captions.map((c) => c.score + (scoreChanges[c.id] || 0)))
      : 0,
  );
  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;
    setPending(true);
    setError("");
    try {
      const form = new FormData();
      form.set("image", file);
      form.set("theme", theme);
      form.set("context", context.trim());
      const response = await fetch("/api/generate", {
        method: "POST",
        body: form,
      });
      if (response.redirected)
        throw new Error(
          "Please complete your profile before submitting evidence.",
        );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNewCase(data.caseId);
      setOpen(false);
      setFile(null);
      setContext("");
      setPreview("");
      setTab("Docket");
      setScoreChanges({});
      setMyVotes({});
      setNotice("READY FOR JUDGMENT. Your case is on the docket.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not submit evidence. Try again.",
      );
    } finally {
      setPending(false);
    }
  }
  async function vote(captionId: string, value: number, oldVote: number) {
    setVoting(captionId);
    setError("");
    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captionId, value }),
      });
      if (response.redirected)
        throw new Error("Please complete your profile before voting.");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const previous = myVotes[captionId] ?? oldVote;
      setMyVotes((v) => ({ ...v, [captionId]: value }));
      setScoreChanges((v) => ({
        ...v,
        [captionId]: (v[captionId] || 0) + value - previous,
      }));
      setNotice("Verdict recorded. You can change your mind anytime.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not record verdict.",
      );
    } finally {
      setVoting(null);
    }
  }
  return (
    <main className="court-shell">
      <div className="court-meta">
        <span>THE PEOPLE’S COURT OF QUESTIONABLE HUMOR</span>
        <span>NEW YORK, NY · EST. 2026</span>
      </div>
      <section className="court-hero">
        <div>
          <p className="eyebrow">
            <span className="live-dot" /> COURT IS NOW IN SESSION
          </p>
          <h1>
            Good photos.
            <br />
            Bad jokes.
            <br />
            <em>You be the judge.</em>
          </h1>
          <p className="hero-copy">
            Your camera roll has a case to make. We supply the AI captions. You
            decide which ones deserve a laugh.
          </p>
          <div className="hero-actions">
            {loggedIn ? (
              <button
                className="court-button"
                onClick={() => {
                  setError("");
                  setOpen(true);
                }}
              >
                Submit evidence <span>↗</span>
              </button>
            ) : (
              <Link className="court-button" href="/login?next=/">
                Sign in to submit evidence ↗
              </Link>
            )}
            <a href="#docket" className="text-link">
              Take the jury seat ↓
            </a>
          </div>
          <p className="fine-print">
            ONE PHOTO. THREE CAPTIONS. THE VERDICT IS YOURS.
          </p>
        </div>
        <div className="hero-exhibit" aria-label="Illustrated evidence folder">
          <div className="folder-tab">EXHIBIT A / YOUR CAMERA ROLL</div>
          <div className="exhibit-paper">
            <div className="exhibit-top">
              <span>THE CITY VS. YOUR SENSE OF HUMOR</span>
              <span>№ 001</span>
            </div>
            <div className="city-illustration">
              <svg
                viewBox="0 0 440 230"
                role="img"
                aria-label="A pigeon overseeing a New York subway"
              >
                <rect width="440" height="230" fill="#bcc5b6" />
                <path
                  d="M0 180H440M0 200H440M60 0V230M160 0V230M260 0V230M360 0V230"
                  stroke="#a8b2a2"
                  strokeWidth="2"
                />
                <rect
                  x="30"
                  y="22"
                  width="240"
                  height="44"
                  rx="2"
                  fill="#252b27"
                />
                <text
                  x="44"
                  y="50"
                  fill="#faf7ef"
                  fontSize="19"
                  fontFamily="sans-serif"
                >
                  116 St — Columbia
                </text>
                <circle cx="305" cy="44" r="19" fill="#b12e2a" />
                <text x="299" y="51" fill="white" fontSize="22">
                  1
                </text>
                <path d="M30 196L409 196" stroke="#444b40" strokeWidth="8" />
                <ellipse cx="300" cy="148" rx="49" ry="32" fill="#5a6669" />
                <path
                  d="M266 149Q256 115 280 104Q301 105 304 143"
                  fill="#697879"
                />
                <circle cx="278" cy="113" r="4" fill="#f5d96d" />
                <circle cx="279" cy="113" r="2" />
                <path d="M264 117L248 124L266 129" fill="#d49b63" />
                <path
                  d="M306 152Q327 140 344 151L366 166L326 170"
                  fill="#45545c"
                />
                <path
                  d="M286 174L281 193M310 176L316 193M269 195H291M305 195H329"
                  stroke="#9d563e"
                  strokeWidth="4"
                />
                <text
                  x="42"
                  y="139"
                  fill="#485042"
                  fontSize="13"
                  fontFamily="monospace"
                >
                  PLEASE STAND
                </text>
                <text
                  x="42"
                  y="160"
                  fill="#485042"
                  fontSize="13"
                  fontFamily="monospace"
                >
                  CLEAR OF THE
                </text>
                <text
                  x="42"
                  y="181"
                  fill="#485042"
                  fontSize="13"
                  fontFamily="monospace"
                >
                  MAIN CHARACTER.
                </text>
              </svg>
            </div>
            <p className="exhibit-caption">
              “He pays $0 rent and still complains about the neighborhood.”
            </p>
            <div className="exhibit-bottom">
              <span>ILLUSTRATED CONCEPT PREVIEW</span>
              <span>NOT AN ACTUAL CASE</span>
            </div>
            <div className="judgment-stamp">
              READY FOR
              <br />
              JUDGMENT
            </div>
          </div>
          <div className="paper-note">
            No law degree required.
            <br />
            Just questionable taste.
          </div>
        </div>
      </section>
      <section className="daily-brief">
        <span className="brief-icon">✳</span>
        <div>
          <p className="eyebrow">TODAY’S OPTIONAL BRIEF</p>
          <h2>{prompts[today]}</h2>
        </div>
        <p>
          Spotted something on campus or in the city?
          <br />
          File it. Let the internet deliberate.
        </p>
      </section>
      <section id="docket">
        <div className="docket-header">
          <div className="court-tabs" role="tablist" aria-label="Case feed">
            {["Docket", "Hall of Fame"].map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t === "Docket" ? "↳ " : "✦ "}
                {t}
              </button>
            ))}
          </div>
          <span className="case-count">
            {evidence.length} CASE{evidence.length === 1 ? "" : "S"} ON FILE
          </span>
        </div>
        <p role="status" className={notice ? "court-notice" : "sr-only"}>
          {notice}
        </p>
        {!open && error && (
          <p role="alert" className="court-error">
            {error}
          </p>
        )}
        {setupError && (
          <p className="setup-note">
            The court’s records are not connected yet. Your clerk needs to run
            the Caption Court database setup.
          </p>
        )}
        {!sorted.length ? (
          <div className="empty-docket">
            <span className="empty-symbol">§</span>
            <p className="eyebrow">THE DOCKET IS OPEN</p>
            <h2>The first case could be yours.</h2>
            <p>
              A chaotic dining hall meal. A subway side quest.
              <br />
              That one photo your group chat won’t let go of.
            </p>
            {loggedIn ? (
              <button className="text-link" onClick={() => setOpen(true)}>
                File the first case ↗
              </button>
            ) : (
              <Link className="text-link" href="/login?next=/">
                Sign in to file a case ↗
              </Link>
            )}
          </div>
        ) : (
          <div className="case-grid">
            {sorted.map((item, index) => (
              <article
                key={item.id}
                className={`case-card ${newCase === item.id ? "new-case" : ""}`}
              >
                <div className="case-card-top">
                  <span>EXHIBIT {String(index + 1).padStart(3, "0")}</span>
                  <span>{item.theme}</span>
                </div>
                <div className="evidence-photo">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.description || "Submitted photo evidence"}
                      fill
                      unoptimized
                      sizes="(max-width: 760px) 100vw, 50vw"
                    />
                  ) : (
                    <p>Evidence photo unavailable. Refresh to retry.</p>
                  )}
                  <span className="photo-label">READY FOR JUDGMENT</span>
                </div>
                <div className="case-caption-list">
                  {item.captions.map((caption, i) => {
                    const selected = myVotes[caption.id] ?? caption.myVote;
                    return (
                      <div className="caption-entry" key={caption.id}>
                        <div className="caption-copy">
                          <span className="caption-number">0{i + 1}</span>
                          <p>{caption.content}</p>
                        </div>
                        <div className="verdict-row">
                          {loggedIn ? (
                            <>
                              <button
                                disabled={voting !== null}
                                aria-pressed={selected === 1}
                                className={
                                  selected === 1
                                    ? "vote-positive selected"
                                    : "vote-positive"
                                }
                                onClick={() =>
                                  vote(caption.id, 1, caption.myVote)
                                }
                              >
                                ✦ Comedy gold
                              </button>
                              <button
                                disabled={voting !== null}
                                aria-pressed={selected === -1}
                                className={
                                  selected === -1
                                    ? "vote-negative selected"
                                    : "vote-negative"
                                }
                                onClick={() =>
                                  vote(caption.id, -1, caption.myVote)
                                }
                              >
                                ↓ Not guilty of funny
                              </button>
                            </>
                          ) : (
                            <Link href="/login?next=/" className="jury-login">
                              Sign in to deliver a verdict ↗
                            </Link>
                          )}
                          <span
                            className="vote-score"
                            aria-label="Net vote score"
                          >
                            {caption.score + (scoreChanges[caption.id] || 0) > 0
                              ? "+"
                              : ""}
                            {caption.score + (scoreChanges[caption.id] || 0)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <details className="case-details">
                  <summary>Behind the joke · AI process</summary>
                  <p>
                    <strong>Scene description</strong>
                    <br />
                    {item.description}
                  </p>
                  <p>
                    <strong>Image prompt</strong>
                    <br />
                    {item.vision_prompt}
                  </p>
                  <p>
                    <strong>Caption prompt</strong>
                    <br />
                    {item.caption_prompt}
                  </p>
                  <p>
                    Generated with {item.model}. Photos and captions are shared
                    publicly. Votes are private; scores are public.
                  </p>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
      <footer className="court-footer">
        <span>CAPTION COURT</span>
        <p>AI writes the jokes. The people have the last word.</p>
        <span>ALL RISE. OR JUST SCROLL.</span>
      </footer>
      <dialog
        ref={dialog}
        className="upload-dialog"
        onCancel={(e) => {
          if (pending) e.preventDefault();
          else setOpen(false);
        }}
      >
        <div className="dialog-head">
          <span className="eyebrow">EVIDENCE INTAKE</span>
          <button
            aria-label="Close upload"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
        <h2>Make your case.</h2>
        <p>
          Submit a photo. AI studies the scene, then writes three captions for
          the jury.
        </p>
        <form onSubmit={generate}>
          <label className="upload-zone">
            {file && preview ? (
              <Image
                src={preview}
                alt="Your selected image"
                width={460}
                height={200}
                unoptimized
              />
            ) : (
              <>
                <span>↥</span>
                <strong>Choose photo evidence</strong>
                <small>JPG, PNG, or WebP · up to 3 MB</small>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={pending}
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (
                  selected &&
                  selected.size <= 3145728 &&
                  ["image/jpeg", "image/png", "image/webp"].includes(
                    selected.type,
                  )
                ) {
                  setFile(selected);
                  setPreview(URL.createObjectURL(selected));
                  setError("");
                } else {
                  setFile(null);
                  setPreview("");
                  setError("Choose a JPG, PNG, or WebP under 3 MB.");
                }
              }}
              aria-label="Choose photo evidence"
            />
          </label>
          <div className="context-field">
            <label htmlFor="image-context">What’s the story? <span>(optional)</span></label>
            <textarea
              id="image-context"
              name="context"
              rows={3}
              maxLength={1000}
              value={context}
              disabled={pending}
              onChange={(event) => setContext(event.target.value)}
              placeholder="e.g. My roommate made this at 2 a.m. during finals and called it gourmet."
              aria-describedby="context-help context-count"
            />
            <div className="context-help-row">
              <p id="context-help">Add details the photo can’t explain. Context is saved with the public AI prompt.</p>
              <span id="context-count">{context.length}/1000</span>
            </div>
          </div>
          <fieldset disabled={pending}>
            <legend>Pick your flavor of funny</legend>
            <div className="theme-options">
              {themes.map((t) => (
                <button
                  type="button"
                  key={t}
                  aria-pressed={theme === t}
                  className={theme === t ? "selected" : ""}
                  onClick={() => setTheme(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="upload-disclosure">
            Your photo and captions will be public. Your image is sent to Google
            Gemini for analysis. Only upload photos you’re comfortable sharing.
          </p>
          {error && (
            <p role="alert" className="court-error">
              {error}
            </p>
          )}
          {pending && (
            <div className="processing" role="status">
              <span className="live-dot" /> Examining evidence & preparing
              arguments…
              <small>
                This can take about a minute. Keep this window open.
              </small>
            </div>
          )}
          <button
            className="court-button generate-button"
            disabled={!file || pending}
          >
            {pending ? "Court clerk at work…" : "Generate my captions ↗"}
          </button>
        </form>
      </dialog>
    </main>
  );
}
