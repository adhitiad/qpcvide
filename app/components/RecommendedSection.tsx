import { useEffect, useState } from "react";
import { useTranslation } from "~/context/I18nContext";
import { VideoCard } from "./VideoCard";

export function RecommendedSection() {
  const { t } = useTranslation();
  const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchRecommendations() {
      if (typeof window === "undefined" || !(window as any).getFingerprint) {
        setLoading(false);
        return;
      }

      try {
        const fp = await (window as any).getFingerprint();
        const res = await fetch(`/api/recommendations?fp=${encodeURIComponent(fp)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        
        const data = await res.json();
        if (isMounted) {
          setRecommendedVideos(data.videos || []);
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRecommendations();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="mb-12">
        <h2 className="text-2xl font-serif font-bold text-white mb-6">
          {t("home.recommended")}
        </h2>
        <div className="flex items-center justify-center h-32 bg-night-card rounded-xl border border-night-border animate-pulse">
          <span className="text-night-muted">Loading recommendations...</span>
        </div>
      </section>
    );
  }

  if (recommendedVideos.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-serif font-bold text-white mb-6">
        {t("home.becauseWatched")}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {recommendedVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  );
}
