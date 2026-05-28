import * as React from "react";
import { Link } from "react-router";
import Autoplay from "embla-carousel-autoplay";
import { Play, Info } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { OptimizedImage } from "./OptimizedImage";
import { useTranslation } from "~/context/I18nContext";

import { CategoryBadge } from "./CategoryBadge";

interface FeaturedVideo {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  thumbnail: string;
  categories: { category: { name: string; type: string } }[];
}

interface HeroCarouselProps {
  items: FeaturedVideo[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const { t } = useTranslation();
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  if (!items || items.length === 0) return null;

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full max-w-6xl mx-auto rounded-xl overflow-hidden group mb-12 shadow-2xl shadow-night-accent/10"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {items.map((video, index) => (
          <CarouselItem key={video.id}>
            <div className="relative aspect-[21/9] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden">
              <div className="absolute inset-0">
                <OptimizedImage
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  sizes="100vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-night-bg via-night-bg/50 to-transparent flex flex-col justify-end p-6 md:p-12">
                <div className="max-w-3xl animate-in slide-in-from-bottom-4 duration-700">
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {video.categories?.slice(0, 3).map((c) => (
                      <CategoryBadge key={c.category.name} category={c.category} className="shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
                    ))}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4 line-clamp-2">
                    {video.title}
                  </h2>
                  <p className="text-night-muted text-sm md:text-base line-clamp-3 mb-6 max-w-2xl">
                    {video.synopsis}
                  </p>
                  <div className="flex gap-4">
                    <Button
                      asChild
                      size="lg"
                      className="bg-white text-black hover:bg-white/90 gap-2 font-bold transition-transform hover:scale-105"
                    >
                      <Link to={`/video/${video.slug}`}>
                        <Play className="w-5 h-5 fill-current" />
                        {t("video.watchNow")}
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="gap-2 border-white/20 hover:bg-white/10 text-white backdrop-blur-sm"
                    >
                      <Link to={`/video/${video.slug}`}>
                        <Info className="w-5 h-5" />
                        {t("video.details")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 border-white/10 hover:bg-black/80 text-white" />
      <CarouselNext className="right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 border-white/10 hover:bg-black/80 text-white" />
    </Carousel>
  );
}
