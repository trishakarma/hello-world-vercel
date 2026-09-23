import Link from "next/link";

import { createSupabaseClient } from "@/lib/supabase/server";
import type { Item } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const statusLabels: Record<Item["status"], string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

function MissingEnvMessage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Items</h1>
      <p className="mt-4 text-neutral-600">
        Supabase is not configured yet. Copy <code>.env.example</code> to{" "}
        <code>.env.local</code> and add your project URL and anon key.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-medium underline underline-offset-4"
      >
        Back home
      </Link>
    </main>
  );
}

export default async function ItemsPage() {
  let items: Item[] | null = null;
  let errorMessage: string | null = null;

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      errorMessage = error.message;
    } else {
      items = data;
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Missing Supabase environment variables")
    ) {
      return <MissingEnvMessage />;
    }

    errorMessage =
      error instanceof Error ? error.message : "Failed to load items.";
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
            Supabase
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Items</h1>
          <p className="mt-2 max-w-2xl text-neutral-600">
            Rows fetched live from your <code>items</code> table.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium underline underline-offset-4"
        >
          Back home
        </Link>
      </div>

      {errorMessage ? (
        <div className="mt-10 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <p className="font-medium">Could not load items</p>
          <p className="mt-1 text-sm">{errorMessage}</p>
          <p className="mt-3 text-sm">
            Make sure you ran <code>supabase/schema.sql</code> in your Supabase
            project.
          </p>
        </div>
      ) : items && items.length > 0 ? (
        <div className="mt-10 overflow-hidden rounded-xl border border-neutral-200">
          <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 font-medium text-neutral-700">Title</th>
                <th className="px-4 py-3 font-medium text-neutral-700">
                  Description
                </th>
                <th className="px-4 py-3 font-medium text-neutral-700">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-neutral-700">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {item.title}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {item.description ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                      {statusLabels[item.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed border-neutral-300 px-6 py-10 text-center text-neutral-600">
          No items yet. Run the SQL in <code>supabase/schema.sql</code> to seed
          sample rows.
        </div>
      )}
    </main>
  );
}
