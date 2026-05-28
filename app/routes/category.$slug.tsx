import type { Route } from "./+types/category.$slug";
import { useLoaderData, useSearchParams } from "react-router";
import { prisma } from "../lib/db.server";
import { VideoCard } from "../components/VideoCard";
import { FilterBar } from "../components/FilterBar";
import { Prisma } from "@prisma/client";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import { Loader2 } from "lucide-react";
import { cachedQuery } from "../lib/redis.server";
import { useTranslation } from "~/context/I18nContext";

export const meta = ({ data }: Route.MetaArgs) => {
  if (!data?.category) {
    return [
      { title: "Category Not Found" },
      { name: "description", content: "The category you are looking for does not exist." }
    ];
  }
  
  return [
    { title: `${data.category.name.toUpperCase()} Video - Auiso` },
    { name: "description", content: `Watch the best ${data.category.name} video on Auiso.` },
  ];
};

export async function loader({ params, request }: Route.LoaderArgs) {
  const { slug } = params;
  
  // Find category by name (case-insensitive search that works across SQLite and Postgres)
  const categories = await prisma.category.findMany();
  const category = categories.find(c => c.name.toLowerCase() === slug?.toLowerCase());

  if (!category) {
    throw new Response("Not Found", { status: 404 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "12", 10);
  const tag = url.searchParams.get("tag");
  const sort = url.searchParams.get("sort") || "newest";

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.VideoWhereInput = {
    categories: {
      some: {
        categoryId: category.id
      }
    }
  };

  if (tag && tag !== "all") {
    where.tags = {
      some: {
        tag: { name: tag },
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

  // Fetch data with caching
  const cacheKey = `cat:${slug}:p${page}:s${sort}:t${tag || "all"}`;
  const [videos, totalVideos, tags] = await Promise.all([
    cachedQuery(`${cacheKey}:videos`, 60, () =>
      prisma.video.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          tags: { include: { tag: true } },
        },
      })
    ),
    cachedQuery(`${cacheKey}:total`, 60, () =>
      prisma.video.count({ where })
    ),
    cachedQuery("cat:tags", 120, () =>
      prisma.tag.findMany({ orderBy: { name: "asc" } })
    ),
  ]);

  return {
    category,
    videos,
    totalVideos,
    tags,
    page,
    totalPages: Math.ceil(totalVideos / limit),
    url: new URL(request.url).origin,
  };
}

export default function CategoryPage() {
  const { t } = useTranslation();
  const { category, videos: initialVideos, totalVideos, tags, page: initialPage, totalPages, url } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const { items: videos, hasMore, ref, isFetching } = useInfiniteScroll({
    initialData: initialVideos,
    totalPages,
    currentPage: initialPage,
    searchParams,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": url
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Categories",
        "item": `${url}/`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": category.name,
        "item": `${url}/category/${category.name.toLowerCase()}`
      }
    ]
  };

  return (
    <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2 uppercase">
          {category.name} <span className="text-night-accent">{t("category.video")}</span>
        </h1>
        <p className="text-night-muted">
          {t("category.showing", { count: videos.length, total: totalVideos, category: category.name })}
        </p>
      </div>

      {/* Filter Bar (Only tags and sort) */}
      <FilterBar tags={tags} />

      {/* Video Grid */}
      <section className="mb-12">
        {videos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-night-card rounded-xl border border-night-border">
            <h3 className="text-xl text-night-muted">{t("search.noResults")}</h3>
            <p className="text-night-muted/60 mt-2">{t("search.adjustQuery")}</p>
          </div>
        )}
      </section>

      {/* Infinite Scroll Trigger */}
      {hasMore && (
        <div ref={ref} className="flex justify-center my-8 py-4">
          <Loader2 className="w-8 h-8 animate-spin text-night-accent" />
        </div>
      )}
    </main>
  );
}
