import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        Hello World Vercel
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Hello World</h1>
      <p className="mt-4 max-w-xl text-lg text-neutral-600">
        This app is connected to Supabase. View the items stored in your
        database on the list page.
      </p>
      <Link
        href="/items"
        className="mt-8 inline-flex w-fit items-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
      >
        View items from Supabase
      </Link>
    </main>
  );
}
