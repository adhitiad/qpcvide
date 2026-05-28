import type { Route } from "./+types/search";
import { prisma } from "../lib/db.server";
import { VideoCard } from "../components/VideoCard";
import { useLoaderData, useSearchParams } from "react-router";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import { Loader2 } from "lucide-react";

export const meta = ({ location }: Route.MetaArgs) => {
  const q = new URLSearchParams(location.search).get("q") || "";
  return [
    { title: `Search Results for "${q}" - Video Hub` },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = 20;
  const skip = (page - 1) * limit;

  const whereClause = q
    ? {
        OR: [
          { title: { contains: q } },
          { tags: { some: { tag: { name: { contains: q } } } } },
        ],
      }
    : {};

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { views: "desc" },
      include: {
        tags: { include: { tag: true } },
      },
    }),
    prisma.video.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return { videos, total, page, totalPages, q };
}

export default function SearchPage() {
  const { videos: initialVideos, total, page: initialPage, totalPages, q } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const { items: videos, hasMore, ref, isFetching } = useInfiniteScroll({
    initialData: initialVideos,
    totalPages,
    currentPage: initialPage,
    searchParams,
  });

  return (
    <main className="container mx-auto px-4 py-8 min-h-[80vh]">
      <div className="mb-8 border-b border-night-border pb-4">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
          Search Results for <span className="text-night-accent">"{q}"</span>
        </h1>
        <p className="text-night-muted">
          Found {total} {total === 1 ? "video" : "videos"} matching your query.
        </p>
      </div>

      {videos.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video as any} />
            ))}
          </div>

          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <div ref={ref} className="flex justify-center my-8 py-4 w-full">
              <Loader2 className="w-8 h-8 animate-spin text-night-accent" />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-night-card rounded-xl border border-night-border">
          <h3 className="text-xl text-night-muted">No results found</h3>
          <p className="text-night-muted/60 mt-2">Try adjusting your search query.</p>
        </div>
      )}
    </main>
  );
}
