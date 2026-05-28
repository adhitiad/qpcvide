import type { Route } from "./+types/_index";
import { useLoaderData, useSearchParams } from "react-router";
import { prisma } from "../lib/db.server";
import { HeroCarousel } from "../components/HeroCarousel";
import { VideoCard } from "../components/VideoCard";
import { FilterBar } from "../components/FilterBar";
import { RecommendedSection } from "../components/RecommendedSection";
import { AdDisplay } from "../components/ads/AdDisplay";
import { Prisma } from "@prisma/client";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import { Loader2 } from "lucide-react";
import { cachedQuery } from "../lib/redis.server";

export const meta = () => {
  return [
    { title: "Video Hub - Dark Video Night" },
    { name: "description", content: "Watch the best videos." },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "12", 10);
  const tag = url.searchParams.get("tag");
  const category = url.searchParams.get("category");
  const sort = url.searchParams.get("sort") || "newest";

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.VideoWhereInput = {};

  if (tag && tag !== "all") {
    where.tags = {
      some: {
        tag: { name: tag },
      },
    };
  }

  if (category && category !== "all") {
    where.categories = {
      some: {
        category: { name: category },
      },
    };
  }

  // Build order by
  let orderBy: Prisma.VideoOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "popular" || sort === "views") {
    orderBy = { views: "desc" };
  } else if (sort === "newest") {
    orderBy = { releaseDate: "desc" };
  }

  // Fetch data that must block rendering (Hero carousel & filters)
  const [tags, categories, featured] = await Promise.all([
    cachedQuery("home:tags", 120, () =>
      // @ts-expect-error - cacheStrategy is added by Prisma Accelerate
      prisma.tag.findMany({ orderBy: { name: "asc" }, cacheStrategy: { swr: 60, ttl: 60 } })
    ),
    cachedQuery("home:categories", 120, () =>
      // @ts-expect-error - cacheStrategy is added by Prisma Accelerate
      prisma.category.findMany({ orderBy: { name: "asc" }, cacheStrategy: { swr: 60, ttl: 60 } })
    ),
    cachedQuery("home:featured", 120, () =>
      prisma.video.findMany({
        orderBy: { views: "desc" },
        take: 5,
        include: {
          categories: { include: { category: true } },
        },
        // @ts-expect-error - cacheStrategy is added by Prisma Accelerate
        cacheStrategy: { swr: 60, ttl: 60 },
      })
    ),
  ]);

  // Defer the heavy list queries
  const fetchVideos = () => prisma.video.findMany({
    where,
    orderBy,
    skip,
    take: limit,
    include: {
      categories: { include: { category: true } },
    },
    // @ts-expect-error - cacheStrategy is added by Prisma Accelerate
    cacheStrategy: { swr: 60, ttl: 60 },
  });

  const fetchTotal = () => prisma.video.count({ 
    where, 
    // @ts-expect-error - cacheStrategy is added by Prisma Accelerate
    cacheStrategy: { swr: 60, ttl: 60 } 
  });

  // If this is a fetcher request for pagination, await the data so fetcher.data is populated directly
  if (page > 1) {
    const [videos, totalVideos] = await Promise.all([fetchVideos(), fetchTotal()]);
    return {
      videos,
      totalVideos,
      tags,
      categories,
      featured,
      page,
      limit,
      url: url.origin,
    };
  }

  // For initial load, defer the grid data
  const gridData = Promise.all([fetchVideos(), fetchTotal()]);

  return {
    gridData,
    tags,
    categories,
    featured,
    page,
    limit,
    url: url.origin,
  };
}

import { Suspense } from "react";
import { Await } from "react-router";

export default function Home() {
  const loaderData = useLoaderData<typeof loader>();
  const { tags, categories, featured, page, limit, url } = loaderData;
  const [searchParams] = useSearchParams();

  // Handle both deferred load (gridData) and paginated fetch (videos/totalVideos)
  const isDeferred = "gridData" in loaderData;

  return (
    <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
      {/* Featured Hero Carousel */}
      <section className="mb-12">
        <HeroCarousel items={featured} />
      </section>

      {/* Ad: Between Content */}
      <AdDisplay position="between-content" className="mb-8" />

      {/* Recommended Section (Client-Side) */}
      <RecommendedSection />

      {/* Filter Bar */}
      <FilterBar tags={tags} categories={categories} />

      {/* Video Grid with Suspense */}
      {isDeferred ? (
        <Suspense fallback={
          <div className="flex justify-center my-20">
            <Loader2 className="w-8 h-8 animate-spin text-night-accent" />
          </div>
        }>
          <Await resolve={loaderData.gridData!}>
            {(resolvedData) => {
              const [resolvedVideos, resolvedTotal] = (resolvedData as [any[], number]) || [[], 0];
              return (
                <VideoGrid 
                  initialVideos={resolvedVideos || []}
                  totalVideos={resolvedTotal || 0}
                  page={page}
                  limit={limit}
                  url={url}
                  searchParams={searchParams}
                />
              );
            }}
          </Await>
        </Suspense>
      ) : (
        <VideoGrid 
          initialVideos={loaderData.videos || []}
          totalVideos={loaderData.totalVideos || 0}
          page={page}
          limit={limit}
          url={url}
          searchParams={searchParams}
        />
      )}
    </main>
  );
}

function VideoGrid({ initialVideos, totalVideos, page, limit, url, searchParams }: { initialVideos: any[], totalVideos: number, page: number, limit: number, url: string, searchParams: URLSearchParams }) {
  const totalPages = Math.ceil(totalVideos / limit);
  const { items: videos, hasMore, ref, isFetching } = useInfiniteScroll({
    initialData: initialVideos,
    totalPages,
    currentPage: page,
    searchParams,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": videos.map((video, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `${url}/video/${video.slug}`
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif font-bold text-white">
            Explore Video
          </h2>
          <span className="text-night-muted text-sm">
            Showing {videos.length} of {totalVideos} results
          </span>
        </div>

        {videos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-night-card rounded-xl border border-night-border">
            <h3 className="text-xl text-night-muted">No videos found</h3>
            <p className="text-night-muted/60 mt-2">Try adjusting your filters.</p>
          </div>
        )}
      </section>

      {/* Infinite Scroll Trigger */}
      {hasMore && (
        <div ref={ref} className="flex justify-center my-8 py-4">
          <Loader2 className="w-8 h-8 animate-spin text-night-accent" />
        </div>
      )}
    </>
  );
}
