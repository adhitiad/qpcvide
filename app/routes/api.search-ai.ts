import type { Route } from "./+types/api.search-ai";
import { prisma } from "../lib/db.server";

// Using Exa API for query expansion and semantic understanding
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  
  if (!q) {
    return Response.json({ videos: [], expandedQuery: "" });
  }

  let expandedKeywords: string[] = [q]; // Always include original query
  let exaResults = [];

  // Attempt to call Exa if API key exists
  const exaKey = process.env.EXA_API_KEY;
  if (exaKey) {
    try {
      const exaRes = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": exaKey,
        },
        body: JSON.stringify({
          query: `find concepts and keywords related to: ${q} in anime or video context`,
          useAutoprompt: true,
          numResults: 3,
          contents: { text: { maxCharacters: 500 } },
        }),
      });

      if (exaRes.ok) {
        const data = await exaRes.json();
        exaResults = data.results || [];
        
        // Extract common words from Exa's returned text to expand our search
        const combinedText = exaResults.map((r: any) => r.text || r.title).join(" ").toLowerCase();
        
        // Very basic stop-word removal and keyword extraction (just for demo/proxy purposes)
        const words = combinedText.replace(/[^a-z0-9\s]/g, "").split(/\s+/);
        const stopwords = new Set(["the", "and", "or", "to", "in", "of", "a", "is", "for", "on", "with", "find", "concepts", "related", "anime", "video"]);
        
        const wordCounts = new Map<string, number>();
        for (const w of words) {
          if (w.length > 3 && !stopwords.has(w)) {
            wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
          }
        }
        
        // Top 3 keywords from Exa context
        const sortedWords = Array.from(wordCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
        expandedKeywords = [...expandedKeywords, ...sortedWords];
      }
    } catch (err) {
      console.error("Exa API failed:", err);
    }
  }

  // Use the expanded keywords to search our Prisma DB
  const orConditions = expandedKeywords.map(keyword => ({
    OR: [
      { title: { contains: keyword } },
      { synopsis: { contains: keyword } },
      { tags: { some: { tag: { name: { contains: keyword } } } } },
    ]
  }));

  const videos = await prisma.video.findMany({
    where: {
      OR: orConditions.flat()
    },
    take: 20,
    orderBy: { views: "desc" },
    include: {
      categories: { include: { category: true } },
      tags: { include: { tag: true } }
    }
  });

  return Response.json({
    originalQuery: q,
    expandedKeywords: expandedKeywords.filter(k => k !== q), // show what was added by AI
    videos,
    exaContext: exaResults.length > 0 ? true : false
  });
}
