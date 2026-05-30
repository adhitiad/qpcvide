import type { Route } from "./+types/api.events";
import { z } from "zod";
import { prisma } from "../lib/db.server";
import { checkRateLimit } from "../lib/rate-limiter.server";

const eventSchema = z.object({
  fingerprint: z.string().min(1),
  videoId: z.string().min(1),
  action: z.string().min(1),
});

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await request.json();
    const result = eventSchema.safeParse(payload);

    if (!result.success) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { fingerprint, videoId, action } = result.data;

    const { allowed } = await checkRateLimit(`events:${fingerprint}`, { maxRequests: 30, windowSeconds: 60 });
    
    if (!allowed) {
      return Response.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });
    }

    // Save to UserEvent
    await prisma.userEvent.create({
      data: {
        fingerprint,
        videoId,
        action,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to track event:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
