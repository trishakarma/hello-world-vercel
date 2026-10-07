import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/court";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return Response.json(
        { error: "Sign in to deliver a verdict." },
        { status: 401 },
      );
    const { captionId, value } = await request.json();
    if (
      typeof captionId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(captionId) ||
      ![1, -1].includes(value)
    )
      return Response.json({ error: "Invalid verdict." }, { status: 400 });
    const { error } = await supabase
      .from("caption_votes")
      .upsert(
        { user_id: user.id, caption_id: captionId, value },
        { onConflict: "user_id,caption_id" },
      );
    if (error)
      return Response.json(
        { error: "Could not save your vote. Please try again." },
        { status: 400 },
      );
    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Could not save your vote. Please try again." },
      { status: 503 },
    );
  }
}
