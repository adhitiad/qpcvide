import type { Route } from "./+types/api.recommendations";
import { prisma } from "../lib/db.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const fp = url.searchParams.get("fp");

  if (!fp) {
    return Response.json({ recommendations: [] });
  }

  // Get recommendations for this fingerprint
  const recommended = await prisma.videoRecommendation.findMany({
    where: { fingerprint: fp },
    orderBy: { score: "desc" },
    take: 10,
    include: {
      video: {
        include: {
          categories: { include: { category: true } }
        }
      }
    }
  });

  const videos = recommended.map(r => r.video);

  // Get external search-based recommendations
  let searchBasedVideos: any[] = [];
  let searchedKeywords = "";

  const recentSearch = await prisma.searchReferrer.findFirst({
    where: { fingerprint: fp, searchKeywords: { not: null } },
    orderBy: { createdAt: "desc" }
  });

  if (recentSearch && recentSearch.searchKeywords) {
    searchedKeywords = recentSearch.searchKeywords;
    searchBasedVideos = await prisma.video.findMany({
      where: {
        OR: [
          { title: { contains: searchedKeywords } },
          { synopsis: { contains: searchedKeywords } }
        ]
      },
      take: 6,
      include: {
        categories: { include: { category: true } }
      }
    });
  }

  return Response.json({ videos, searchBasedVideos, searchedKeywords }, {
    headers: { "Cache-Control": "no-store" }
  });
}
