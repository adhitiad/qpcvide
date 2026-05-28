import type { Route } from "./+types/api.cron";
import { checkBlockStatus } from "../lib/block-checker.server";
import { trainModel } from "../lib/recommender.server";

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

  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 500,
    headers: { "Content-Type": "application/json" }
  });
}
