import type { Route } from "./+types/api.moderate";
import { moderateContent } from "../lib/moderation.server";
import { requireAdmin } from "../lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  // Only allow admin to use this API
  await requireAdmin(request);

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    const { text, imageUrl } = body;

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const result = await moderateContent(text, imageUrl);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to process moderation request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
