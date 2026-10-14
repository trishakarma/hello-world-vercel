import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";
const source = await fs.readFile(
  new URL("../lib/daily-court.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { nextCourtOpening, countdownParts, winningCaptions } = await import(
  "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
);
test("Next opening stays at NY midnight across both DST changes", () => {
  assert.equal(
    nextCourtOpening(new Date("2026-03-08T05:00:00Z")),
    "2026-03-09T04:00:00.000Z",
  );
  assert.equal(
    nextCourtOpening(new Date("2026-11-01T04:00:00Z")),
    "2026-11-02T05:00:00.000Z",
  );
  assert.equal(
    nextCourtOpening(new Date("2026-10-14T00:00:00Z")),
    "2026-10-14T04:00:00.000Z",
  );
});
test("Countdown closes exactly at the deadline and never goes negative", () => {
  const deadline = "2026-10-14T00:00:00Z";
  assert.deepEqual(countdownParts(deadline, Date.parse(deadline) - 1000), {
    hours: "00",
    minutes: "00",
    seconds: "01",
  });
  assert.deepEqual(countdownParts(deadline, Date.parse(deadline)), {
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  assert.deepEqual(countdownParts(deadline, Date.parse(deadline) + 5000), {
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
});
test("Results distinguish a shared win from a case with no votes", () => {
  assert.deepEqual(winningCaptions([{ id: "a", score: 0, votes: 0 }]), []);
  assert.deepEqual(
    winningCaptions([
      { id: "a", score: 2, votes: 2 },
      { id: "b", score: 2, votes: 4 },
      { id: "c", score: 1, votes: 3 },
    ]).map((c) => c.id),
    ["a", "b"],
  );
});
const pgModule = process.env.COURT_PGLITE_MODULE;
test(
  "Database trigger rejects late inserts and changes; regular cases stay open",
  {
    skip:
      !pgModule &&
      "Set COURT_PGLITE_MODULE to a PGlite installation to run the isolated SQL test",
  },
  async () => {
    const { PGlite } = await import(pgModule);
    const db = new PGlite();
    try {
      await db.exec(`create role anon; create role authenticated; create role service_role;
      create table public.court_cases (id uuid primary key default gen_random_uuid(), status text default 'ready', created_at timestamptz default now());
      create table public.captions (id uuid primary key default gen_random_uuid(),case_id uuid references public.court_cases(id));
      create table public.caption_votes (id uuid primary key default gen_random_uuid(),user_id uuid,caption_id uuid references public.captions(id),value integer);
      grant select on public.court_cases,public.captions to anon,authenticated;
      grant select,insert,update on public.caption_votes to authenticated;`);
      await db.exec(
        await fs.readFile(
          new URL("../supabase/daily-court.sql", import.meta.url),
          "utf8",
        ),
      );
      const cases = (
        await db.query(
          `insert into public.court_cases(status) values ('ready'),('ready') returning id`,
        )
      ).rows;
      const caption = (
        await db.query(
          "insert into public.captions(case_id) values ($1),($2) returning id",
          [cases[0].id, cases[1].id],
        )
      ).rows;
      await db.query(
        `insert into public.daily_court_sessions(session_date,case_id,opens_at,closes_at) values ((now() at time zone 'America/New_York')::date,$1,now()-interval '1 hour',now()+interval '1 hour')`,
        [cases[0].id],
      );
      const first = (
        await db.query("select * from public.ensure_daily_court()")
      ).rows;
      const second = (
        await db.query("select * from public.ensure_daily_court()")
      ).rows;
      assert.equal(
        first[0].case_id,
        second[0].case_id,
        "Daily selection is fixed",
      );
      await db.exec("set role authenticated");
      await db.query(
        "insert into public.caption_votes(user_id,caption_id,value) values ($1,$2,1)",
        ["00000000-0000-0000-0000-000000000001", caption[0].id],
      );
      await assert.rejects(
        db.query("update public.caption_votes set caption_id=$1", [
          caption[1].id,
        ]),
        /Vote identity cannot be changed/,
      );
      await db.exec("reset role");
      await db.query(
        `update public.daily_court_sessions set opens_at=now()-interval '2 hours',closes_at=now()-interval '1 hour'`,
      );
      await db.exec("set role authenticated");
      await assert.rejects(
        db.query(
          "insert into public.caption_votes(user_id,caption_id,value) values ($1,$2,1)",
          ["00000000-0000-0000-0000-000000000002", caption[0].id],
        ),
        /COURT_CLOSED/,
      );
      await assert.rejects(
        db.query("update public.caption_votes set value=-1"),
        /COURT_CLOSED/,
      );
      await db.query(
        "insert into public.caption_votes(user_id,caption_id,value) values ($1,$2,1)",
        ["00000000-0000-0000-0000-000000000001", caption[1].id],
      );
      await db.exec("set role anon");
      await assert.rejects(
        db.query(
          "insert into public.caption_votes(user_id,caption_id,value) values ($1,$2,1)",
          ["00000000-0000-0000-0000-000000000001", caption[1].id],
        ),
        /permission denied/,
      );
    } finally {
      await db.close();
    }
  },
);
