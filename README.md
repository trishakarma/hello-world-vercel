# Caption Court

Photo evidence. AI captions. A jury of your peers.

## What’s implemented

- Google sign-in and existing profiles.
- Public case feed with photos and three AI-generated captions per case.
- Authenticated photo submissions (JPEG, PNG, WebP; 3 MB maximum).
- Optional photo context (up to 1,000 characters), included in the saved public caption prompt.
- A two-call Gemini prompt chain: image → scene description → three funny captions.
- Saved original photo, scene description, both exact prompts, model, theme, and timestamps.
- One up/down verdict per user per caption; changing a verdict updates the existing row.
- Private individual votes with public aggregate scores.
- Docket and Hall of Fame views of the most recent 40 cases.
- A weekday campus/NYC inspiration brief and three humor styles.
- RLS migration covering all existing public tables, profiles, generations, votes, and photo access.

## Connect the database and AI

1. In Supabase SQL Editor, run `supabase/schema.sql` and `supabase/profiles.sql` only if your Assignment #3 database has not already been initialized. Then run **`supabase/caption-court.sql`**. The court migration can be run again safely. It enables RLS on every existing public table; unrelated tables without policies become inaccessible to clients. Existing unrelated policies are retained, so review any policies you added outside this repository.
2. Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
3. Add **`SUPABASE_SERVICE_ROLE_KEY`** from your Supabase project API settings and **`GEMINI_API_KEY`** from [Google AI Studio](https://aistudio.google.com/apikey). Keep both server-only: never prefix them with `NEXT_PUBLIC_`, commit them, or paste them into chat.
4. Optionally set `GEMINI_MODEL`; the default is `gemini-3.5-flash-lite`. The model must support image input and structured JSON output. Availability and quotas depend on the key/account.
5. Restart the app: `npm run dev -- --webpack`.

The server key is used only by the image-generation route. Ordinary browsing and voting use the signed-in user's cookie-aware Supabase client. Generations cannot be inserted/changed through the anonymous or authenticated database API. The storage bucket is private, and signed photo URLs are issued only for published cases. Uploaded images are deliberately shared publicly after generation, as the upload screen explains.

## Verify before submission

- Open `/` signed out: browse cases, but voting and uploads require sign-in.
- Sign in with Google and complete your profile if prompted.
- Submit an image; see three captions and the READY FOR JUDGMENT label. Expand “Behind the joke” to inspect the stored prompts.
- Vote and refresh: the verdict and score persist. Switch your vote: only one row exists for your user/caption pair.
- Sign in as a second user: votes remain independent. Supabase clients must not be able to read or update another user's vote or profile.
- Try an oversized/unsupported file and invalid/missing AI key: show helpful errors without publishing a partial case.
- Check narrow/mobile layout and keyboard navigation.
- `npm run lint` and `npm run build -- --webpack`.
- With the local server running, `node --test tests/court-access.test.mjs` checks anonymous API protection and request-origin protection.

## Vercel

Add the same four environment variables to your Vercel project and deploy this repository. Add the Vercel domain to Supabase Auth's Site URL / redirect URL allowlist; Google OAuth uses the Supabase project's callback URL. Disable Vercel Deployment Protection for the assignment deployment in the project settings, then check the deployment in Incognito.

Submit the unique deployment URL tied to your final commit, not only the moving production alias. The current implementation has not applied the database migration or deployed itself; account setup and the live generation/voting check must be completed before submission.

## Implementation notes

The server creates a pending case before calling AI. There is no application submission cap. Publication and all three captions are saved in one transaction. Failed generations are hidden, their storage objects are removed, and failed attempts do not prevent further submissions. A terminated server request may leave a hidden pending reservation or orphan object, which can be cleaned up by the project owner. Photos and generated text are user content; the initial jury should report inappropriate uploads to the project owner until moderation is added.

Gemini integration follows the official [generateContent reference](https://ai.google.dev/api/generate-content).
