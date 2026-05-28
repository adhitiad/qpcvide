import type { Route } from "./+types/api.ads.track";
import { prisma } from "../lib/db.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data = await request.json();
    const { purchaseId, type } = data; // type: "impression" or "click"

    if (!purchaseId || !type) {
      return new Response("Bad Request", { status: 400 });
    }

    if (type === "impression") {
      await prisma.adPurchase.update({
        where: { id: purchaseId },
        data: { impressions: { increment: 1 } }
      });
    } else if (type === "click") {
      await prisma.adPurchase.update({
        where: { id: purchaseId },
        data: { clicks: { increment: 1 } }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
