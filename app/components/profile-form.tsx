"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";

import {
  updateProfileNames,
  type ProfileActionState,
} from "@/app/actions/profile";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

const initialState: ProfileActionState = {};

type Props = {
  profile: Profile;
  userEmail: string | null;
};

export function ProfileForm({ profile, userEmail }: Props) {
  const [state, formAction, pending] = useActionState(
    updateProfileNames,
    initialState,
  );
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onAvatarChange(file: File) {
    setUploadError(null);
    setUploading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUploadError("Sign in again to upload a photo.");
        return;
      }

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadErr) {
        setUploadError(uploadErr.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          avatar_url: cacheBustedUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateErr) {
        setUploadError(updateErr.message);
        return;
      }

      setAvatarUrl(cacheBustedUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-neutral-100">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
              No photo
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-900">Profile photo</p>
          <p className="mt-1 text-sm text-neutral-600">
            Stored in Supabase Storage — only the URL is saved on your profile.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="mt-3 block text-sm"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onAvatarChange(file);
            }}
          />
          {uploading ? (
            <p className="mt-2 text-sm text-neutral-500">Uploading…</p>
          ) : null}
          {uploadError ? (
            <p className="mt-2 text-sm text-red-600">{uploadError}</p>
          ) : null}
        </div>
      </div>

      <form action={formAction} className="max-w-md space-y-4">
        {userEmail ? (
          <p className="text-sm text-neutral-600">
            Signed in as <span className="font-medium">{userEmail}</span>
          </p>
        ) : null}

        <div>
          <label htmlFor="first_name" className="block text-sm font-medium">
            First name
          </label>
          <input
            id="first_name"
            name="first_name"
            defaultValue={profile.first_name ?? ""}
            required
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
            defaultValue={profile.last_name ?? ""}
            required
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        {state.error ? (
          <p className="text-sm text-red-600">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-green-700">Profile saved.</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
