"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import {
  updateProfileNames,
  type ProfileActionState,
} from "@/app/actions/profile";

const initialState: ProfileActionState = {};

export function CompleteProfileForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (prev: ProfileActionState, formData: FormData) => {
      const result = await updateProfileNames(prev, formData);
      if (result.success) {
        router.push("/");
        router.refresh();
      }
      return result;
    },
    initialState,
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <p className="text-neutral-600">
        Welcome! Add your name so we can personalize your experience.
      </p>
      <div>
        <label htmlFor="first_name" className="block text-sm font-medium">
          First name
        </label>
        <input
          id="first_name"
          name="first_name"
          required
          autoComplete="given-name"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="last_name" className="block text-sm font-medium">
          Last name
        </label>
        <input
          id="last_name"
          name="last_name"
          required
          autoComplete="family-name"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
