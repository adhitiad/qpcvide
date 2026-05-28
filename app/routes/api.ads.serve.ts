import type { Route } from "./+types/api.ads.serve";
import { prisma } from "../lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const position = url.searchParams.get("position");

  if (!position) {
    return new Response("Missing position", { status: 400 });
  }

  const now = new Date();

  // Find all active slots for this position
  const slots = await prisma.adSlot.findMany({
    where: { position, active: true },
    include: {
      purchases: {
        where: {
          status: "APPROVED",
          active: true,
          startDate: { lte: now },
          endDate: { gte: now }
        }
      }
    }
  });

  if (slots.length === 0) return Response.json(null);

  // Flatten all valid purchases from the matched slots
  const allPurchases = slots.flatMap(s => s.purchases);

  if (allPurchases.length === 0) return Response.json(null);

  // Pick one randomly
  const randomAd = allPurchases[Math.floor(Math.random() * allPurchases.length)];

  return Response.json(randomAd);
}
