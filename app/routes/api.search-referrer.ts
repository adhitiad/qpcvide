import type { Route } from "./+types/api.search-referrer";
import { prisma } from "../lib/db.server";
import { parseSearchReferrer } from "../lib/search-referrer-parser.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data = await request.json();
    const { fingerprint, referrerUrl } = data;

    if (!fingerprint || !referrerUrl) {
      return new Response("Bad Request", { status: 400 });
    }

    const { searchEngine, searchKeywords } = parseSearchReferrer(referrerUrl);

    // If it's not a recognized search engine with keywords, we can just save it or ignore it.
    // The instructions say: "Simpan ke tabel SearchReferrer via Prisma."
    
    // To prevent duplicate spam, we can check if there's already an exact recent entry for this FP + referrer.
    // But for simplicity, we just insert.
    await prisma.searchReferrer.create({
      data: {
        fingerprint,
        referrerUrl,
        searchEngine,
        searchKeywords
      }
    });

    return Response.json({ success: true });
  } catch (e) {
    console.error("[SearchReferrer API] Error saving referrer:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}
