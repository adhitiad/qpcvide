import type { Route } from "./+types/video.$slug";
import { Link, useLoaderData } from "react-router";
import { useEffect } from "react";
import { prisma } from "../lib/db.server";
import { getUser } from "../lib/auth.server";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Calendar, Eye, Film, Play } from "lucide-react";
import { Player4Me } from "../components/players/Player4Me";
import { Filemoon } from "../components/players/Filemoon";
import { Doodstream } from "../components/players/Doodstream";
import { VideoCard } from "../components/VideoCard";
import { LikeButton } from "../components/LikeButton";
import { BookmarkButton } from "../components/BookmarkButton";
import { CommentSection } from "../components/CommentSection";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";

import { VideoPlayer } from "../components/VideoPlayer";
import { SmartSynopsis } from "../components/SmartSynopsis";
import { externalApi } from "../lib/axios.server";
import { AdDisplay } from "../components/ads/AdDisplay";

import { getDictionary } from "../lib/i18n.server";

export const meta = ({ data }: Route.MetaArgs) => {
  if (!data?.video) {
    return [
      { title: "Video Not Found" },
      {
        name: "description",
        content: "The video you are looking for does not exist.",
      },
    ];
  }

  const currentUrl = data.url;

  return [
    { title: `${data.video.title} - Auiso` },
    { name: "description", content: data.video.synopsis.substring(0, 160) },
    { tagName: "link", rel: "canonical", href: currentUrl },
    { property: "og:site_name", content: "Auiso" },
    { property: "og:type", content: "video.other" },
    { property: "og:url", content: currentUrl },
    { property: "og:image", content: data.video.thumbnail },
    { property: "og:title", content: data.video.title },
    {
      property: "og:description",
      content: data.video.synopsis.substring(0, 160),
    },
    { property: "article:published_time", content: data.video.createdAt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: data.video.title },
    {
      name: "twitter:description",
      content: data.video.synopsis.substring(0, 160),
    },
    { name: "twitter:image", content: data.video.thumbnail },
  ];
};

export async function loader({ params, request }: Route.LoaderArgs) {
  const { slug } = params;
  const authUser = await getUser(request);
  const userId = authUser?.id;
  const { dict, locale } = getDictionary(request);
  const url = request.url;

  // Increment views and fetch data
  const video = await prisma.video.update({
    where: { slug },
    data: { views: { increment: 1 } },
    include: {
      tags: { include: { tag: true } },
      categories: { include: { category: true } },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, username: true } } },
      },
      _count: { select: { likes: true } },
    },
  });

  if (!video) throw new Response("Not Found", { status: 404 });

  let isLiked = false;
  let isBookmarked = false;

  if (userId && typeof userId === "string") {
    const [like, bookmark] = await Promise.all([
      prisma.like.findUnique({
        where: { userId_videoId: { userId, videoId: video.id } },
      }),
      prisma.bookmark.findUnique({
        where: { userId_videoId: { userId, videoId: video.id } },
      }),
    ]);

    isLiked = !!like;
    isBookmarked = !!bookmark;

    const history = await prisma.watchHistory.findUnique({
      where: { userId_videoId: { userId, videoId: video.id } },
    });

    if (history) {
      await prisma.watchHistory.update({
        where: { id: history.id },
        data: { watchedAt: new Date() },
      });
    } else {
      await prisma.watchHistory.create({
        data: { userId, videoId: video.id },
      });
    }
  }

  // Fetch all tags and categories for aggressive internal linking in synopsis
  const [allTags, allCategories] = await Promise.all([
    // @ts-expect-error - cacheStrategy is added by Prisma Accelerate
    prisma.tag.findMany({ select: { name: true }, cacheStrategy: { swr: 60, ttl: 60 } }),
    // @ts-expect-error - cacheStrategy is added by Prisma Accelerate
    prisma.category.findMany({ select: { name: true }, cacheStrategy: { swr: 60, ttl: 60 } }),
  ]);

  // Fetch PeerTube metadata if available
  let videoMeta = null;
  if (video.peerTubeId) {
    try {
      // Basic implementation; PEERTUBE_API_URL could be dynamic or env driven.
      // Here we just use a generic instance or specific URL.
      const peerTubeUrl =
        process.env.PEERTUBE_API_URL || "https://peertube2.cpy.re";
      const res = await externalApi.get(
        `${peerTubeUrl}/api/v1/videos/${video.peerTubeId}`,
      );
      videoMeta = res.data;
    } catch (e) {
      console.error("Failed to fetch PeerTube metadata", e);
    }
  }

  const categoryIds = video.categories.map((c) => c.categoryId);
  const relatedVideos = await prisma.video.findMany({
    where: {
      AND: [
        { id: { not: video.id } },
        categoryIds.length > 0
          ? { categories: { some: { categoryId: { in: categoryIds } } } }
          : {},
      ],
    },
    take: 10,
    orderBy: { views: "desc" },
    include: { tags: { include: { tag: true } } },
    // @ts-expect-error - cacheStrategy is added by Prisma Accelerate
    cacheStrategy: { swr: 60, ttl: 60 },
  });

  return {
    video,
    relatedVideos,
    isLiked,
    isBookmarked,
    isLoggedIn: !!userId,
    videoMeta,
    dict,
    locale,
    url,
    allTagNames: allTags.map((t) => t.name),
    allCategoryNames: allCategories.map((c) => c.name),
  };
}

export default function AnimeDetail() {
  const {
    video,
    relatedVideos,
    isLiked,
    isBookmarked,
    isLoggedIn,
    videoMeta,
    dict,
    locale,
    url,
    allTagNames,
    allCategoryNames,
  } = useLoaderData<typeof loader>();

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return undefined;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `PT${h}H${m}M`;
  };

  useEffect(() => {
    // Send watch event
    if (typeof window !== "undefined" && (window as any).getFingerprint) {
      (window as any).getFingerprint().then((fp: string) => {
        fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fingerprint: fp,
            videoId: video.id,
            action: "watch",
          }),
        }).catch(console.error);
      });
    }
  }, [video.id]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.synopsis,
    thumbnailUrl: video.thumbnail,
    uploadDate: video.createdAt.toISOString(),
    datePublished: video.releaseDate.toISOString(),
    contentUrl: url,
    duration: formatDuration(video.duration),
    isFamilyFriendly: false,
    genre: video.categories?.map((c) => c.category.name),
    keywords: video.tags?.map((t) => t.tag.name).join(", "),
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: { "@type": "WatchAction" },
      userInteractionCount: video.views,
    },
  };

  return (
    <main className="min-h-screen bg-night-bg text-night-text">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Video Player Section (Top) */}
        <div className="mb-8 w-full aspect-video bg-black rounded-xl overflow-hidden border border-night-border shadow-2xl relative">
          {video.peerTubeId || video.externalSourceUrl ? (
            <VideoPlayer
              videoId={video.id}
              peerTubeId={video.peerTubeId}
              externalSourceUrl={video.externalSourceUrl}
              initialLiveStatus={video.isLive}
            />
          ) : video.videoPlatform && video.videoId ? (
            <div className="w-full h-full">
              {video.videoPlatform === "player4me" ? (
                <Player4Me videoId={video.videoId} title={video.title} />
              ) : video.videoPlatform === "filemoon" ? (
                <Filemoon videoId={video.videoId} title={video.title} />
              ) : video.videoPlatform === "doodstream" ? (
                <Doodstream videoId={video.videoId} title={video.title} />
              ) : null}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-night-bg text-night-muted">
              <Film className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-xl font-medium">Video not available</p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex flex-col lg:flex-row gap-8 bg-night-card p-6 md:p-8 rounded-2xl border border-night-border shadow-lg">
          {/* Thumbnail */}
          <div className="w-full lg:w-1/3 flex-shrink-0">
            <div className="relative aspect-square sm:aspect-auto lg:aspect-[3/4] rounded-xl overflow-hidden border border-night-border">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Details */}
          <div className="w-full lg:w-2/3 flex flex-col">
            <div className="flex flex-wrap gap-2 mb-4 justify-between items-start">
              <div className="flex flex-wrap gap-2">
                {video.categories.map((c) => (
                  <Badge
                    key={c.category.name}
                    className="bg-night-accent text-white border-none font-bold px-3 py-1 text-sm"
                  >
                    <Link to={`/category/${c.category.name.toLowerCase()}`}>
                      {c.category.name}
                    </Link>
                  </Badge>
                ))}
              </div>

              {isLoggedIn && (
                <div className="flex gap-2">
                  <LikeButton
                    videoId={video.id}
                    initialLiked={isLiked}
                    likeCount={video._count.likes}
                  />
                  <BookmarkButton
                    videoId={video.id}
                    initialBookmarked={isBookmarked}
                  />
                </div>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">
              {video.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-night-muted mb-6 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-night-cyan" />
                <span>{new Date(video.releaseDate).getFullYear()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-night-cyan" />
                <span>
                  {video.views.toLocaleString("id-ID")} {dict.views}
                </span>
              </div>
            </div>

            <div className="mb-6 flex-grow">
              <h3 className="text-xl font-bold mb-3">{dict.synopsis}</h3>
              <p className="text-night-muted leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                <SmartSynopsis
                  synopsis={video.synopsis}
                  tags={allTagNames}
                  categories={allCategoryNames}
                />
              </p>
            </div>

            <div className="mt-auto pt-6 border-t border-night-border">
              <h3 className="text-lg font-bold mb-3">{dict.tags}</h3>
              <div className="flex flex-wrap gap-2">
                {video.tags.map((t) => (
                  <Badge
                    key={t.tag.name}
                    variant="outline"
                    className="border-night-border text-night-muted hover:bg-night-hover"
                  >
                    {t.tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comment Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <CommentSection
            videoId={video.id}
            initialComments={video.comments as any}
            isLoggedIn={isLoggedIn}
          />
        </div>

        {/* Ad: Sidebar / Before Related */}
        <AdDisplay position="sidebar" className="max-w-4xl mx-auto mb-8" />

        {/* Related Video Section */}
        {relatedVideos.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-serif font-bold mb-6 pl-4 border-l-4 border-night-accent">
              {dict.relatedAnime}
            </h2>
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {relatedVideos.map((item) => (
                  <CarouselItem
                    key={item.id}
                    className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
                  >
                    <div className="p-1 h-full">
                      <VideoCard video={item as any} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 xl:-left-12 bg-night-card border-night-border text-white hover:bg-night-hover" />
              <CarouselNext className="right-0 xl:-right-12 bg-night-card border-night-border text-white hover:bg-night-hover" />
            </Carousel>
          </div>
        )}
      </div>
    </main>
  );
}
