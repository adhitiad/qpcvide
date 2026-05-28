import { Link } from "react-router";
import { Eye, Clock, Star } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { CategoryBadge } from "./CategoryBadge";
import { Badge } from "./ui/badge";

interface VideoCardProps {
  video: {
    title: string;
    slug: string;
    thumbnail: string;
    views: number;
    duration?: number | null;
    isFeatured?: boolean;
    categories?: { category: { name: string; type: string } }[];
  };
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link to={`/video/${video.slug}`} className="block group w-full sm:w-auto">
      <Card className="bg-night-card border-night-border overflow-hidden card-hover h-full flex flex-col relative">
        {video.isFeatured && (
          <div className="absolute -top-1 -right-1 z-10 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-lg flex items-center gap-1">
            <Star className="w-3 h-3 fill-black" /> PRO
          </div>
        )}
        <div className="relative aspect-video overflow-hidden bg-black/50">
          <img
            src={video.thumbnail}
            alt={video.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-semibold text-night-text flex items-center gap-1 backdrop-blur-sm">
            <Eye className="w-3 h-3 text-night-cyan" /> {video.views.toLocaleString("id-ID")}
          </div>
          {video.duration != null && (
            <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-semibold text-night-text flex items-center gap-1 backdrop-blur-sm">
              <Clock className="w-3 h-3 text-night-accent" /> {formatDuration(video.duration)}
            </div>
          )}
        </div>
        <CardContent className="p-3 md:p-4 flex flex-col flex-grow">
          <h3 className="font-serif text-sm md:text-base font-bold text-night-text line-clamp-2 mb-2 group-hover:text-night-accent transition-colors">
            {video.title}
          </h3>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {video.categories?.slice(0, 3).map((c) => (
              <CategoryBadge key={c.category.name} category={c.category} />
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
