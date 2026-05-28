import type { Route } from "./+types/api.events";
import { z } from "zod";
import { prisma } from "../lib/db.server";

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
