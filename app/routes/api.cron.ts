import type { Route } from "./+types/api.cron";
import { checkBlockStatus } from "../lib/block-checker.server";
import { trainModel } from "../lib/recommender.server";
import { prisma } from "../lib/db.server";
import { sendNewVideoNotification } from "../lib/telegram.server";

export async function loader({ request }: Route.LoaderArgs) {
  return handleCronRequest(request);
}

export async function action({ request }: Route.ActionArgs) {
  return handleCronRequest(request);
}

async function handleCronRequest(request: Request) {
  // Simple security check to prevent unauthorized triggers if CRON_SECRET is set
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const result = await checkBlockStatus();
  
  // Update Video Recommendations using Jaccard Similarity
  try {
    await trainModel();
  } catch (error) {
    console.error("Cron failed to train model", error);
  }

  // Telegram Queue Processing
  try {
    const unnotifiedVideo = await prisma.video.findFirst({
      where: { isTelegramNotified: false },
      orderBy: { createdAt: "asc" }
    });

    if (unnotifiedVideo) {
      const origin = new URL(request.url).origin;
      await sendNewVideoNotification(unnotifiedVideo, origin);
      
      await prisma.video.update({
        where: { id: unnotifiedVideo.id },
        data: { isTelegramNotified: true }
      });
      console.log(`Telegram notified for video: ${unnotifiedVideo.slug}`);
    }
  } catch (error) {
    console.error("Cron failed to process Telegram queue", error);
  }

  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 500,
    headers: { "Content-Type": "application/json" }
  });
}
