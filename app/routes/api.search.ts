import type { Route } from "./+types/api.search";
import { data } from "react-router";
import { prisma } from "../lib/db.server";
import { cachedQuery } from "../lib/redis.server";
import { checkRateLimit } from "../lib/rate-limiter.server";

export async function loader({ request }: Route.LoaderArgs) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const { allowed } = await checkRateLimit(`search:${ip}`, { maxRequests: 20, windowSeconds: 60 });
  
  if (!allowed) {
    return Response.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  if (!q) {
    return data([]);
  }

  const videos = await cachedQuery(`search:${q}`, 30, () =>
    prisma.video.findMany({
      where: {
        OR: [
          { title: { contains: q } }, // exact matches since SQLite doesn't have mode: insensitive in prisma
          // Let's rely on Prisma SQLite's default behavior for contains, or lowercase handling on the client
          // wait, Prisma contains on SQLite is case-insensitive by default in the DB but depends on PRAGMA case_sensitive_like. 
          // We'll just pass `contains: q`.
        ],
      },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
      },
    })
  );

  return data(videos);
}
