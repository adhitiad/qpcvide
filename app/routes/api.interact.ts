import type { Route } from "./+types/api.interact";
import { data } from "react-router";
import { prisma } from "../lib/db.server";
import { requireUserId } from "../lib/auth.server";
import { checkRateLimit } from "../lib/rate-limit.server";

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
  const type = formData.get("type"); // "like" or "bookmark"
  const videoId = formData.get("videoId");

  if (!videoId || typeof videoId !== "string") {
    return data({ error: "Invalid videoId" }, { status: 400 });
  }

  // Rate Limiting: 30 interactions per minute per user
  const limitStatus = checkRateLimit(`interact:${userId}`, 30, 60 * 1000);
  if (!limitStatus.success) {
    return data({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
  }

  if (type === "like") {
    const existing = await prisma.like.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    if (existing) {
      await prisma.like.delete({
        where: { id: existing.id },
      });
      return data({ success: true, liked: false });
    } else {
      await prisma.like.create({
        data: { userId, videoId },
      });
      return data({ success: true, liked: true });
    }
  }

  if (type === "bookmark") {
    const existing = await prisma.bookmark.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id },
      });
      return data({ success: true, bookmarked: false });
    } else {
      await prisma.bookmark.create({
        data: { userId, videoId },
      });
      return data({ success: true, bookmarked: true });
    }
  }

  return data({ error: "Invalid type" }, { status: 400 });
}
