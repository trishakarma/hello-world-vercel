import Link from "next/link";

import { GoogleSignInButton } from "@/app/components/google-sign-in-button";

type Props = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextPath = params.next ?? "/";

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-3 text-neutral-600">
        Use Google to access your profile and members-only content.
      </p>
      {params.error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Sign-in failed. Check your Google OAuth and Supabase settings, then
          try again.
        </p>
      ) : null}
      <div className="mt-8">
        <GoogleSignInButton nextPath={nextPath} />
      </div>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-medium underline underline-offset-4"
      >
        Back home
      </Link>
    </main>
  );
}
