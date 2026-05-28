import type { Route } from "./+types/api.comments";
import { data } from "react-router";
import { prisma } from "../lib/db.server";
import { requireUserId } from "../lib/auth.server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const commentSchema = z.object({
  videoId: z.string(),
  content: z.string().min(3, "Comment must be at least 3 characters").max(1000, "Comment is too long"),
});

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const payload = Object.fromEntries(formData);

  const result = commentSchema.safeParse(payload);
  if (!result.success) {
    return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const { videoId, content } = result.data;

  const comment = await prisma.comment.create({
    data: {
      content,
      videoId,
      userId,
    },
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
  });

  // Broadcast new comment via Supabase Realtime
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.channel(`comments:${videoId}`).send({
        type: "broadcast",
        event: "NEW_COMMENT",
        payload: comment,
      });
    }
  } catch (e) {
    // Ignore broadcast errors silently
    console.error("Supabase broadcast error:", e);
  }

  return data({ success: true, comment });
}
