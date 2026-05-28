import { useEffect, useState } from "react";
import { VideoCard } from "../components/VideoCard";
import { Sparkles, Search } from "lucide-react";
import type { MetaFunction } from "react-router";
import { useTranslation } from "~/context/I18nContext";

export const meta: MetaFunction = () => {
  return [
    { title: "For You - Recommended Videos | Auiso" },
    {
      name: "description",
      content: "Personalized video recommendations tailored just for you.",
    },
  ];
};

export default function RecommendedPage() {
  const { t } = useTranslation();
  const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]);
  const [searchBasedVideos, setSearchBasedVideos] = useState<any[]>([]);
  const [searchedKeywords, setSearchedKeywords] = useState<string>("");
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
        const res = await fetch(
          `/api/recommendations?fp=${encodeURIComponent(fp)}`,
        );
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        if (isMounted) {
          setRecommendedVideos(data.videos || []);
          setSearchBasedVideos(data.searchBasedVideos || []);
          setSearchedKeywords(data.searchedKeywords || "");
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif font-bold text-white mb-8 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-night-accent" />
          {t("recommended.forYou")}
        </h1>
        <div className="flex items-center justify-center h-64 bg-night-card rounded-xl border border-night-border animate-pulse">
          <span className="text-night-muted">
            {t("recommended.curating")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold text-white mb-8 flex items-center gap-2">
        <Sparkles className="w-8 h-8 text-night-accent" />
        {t("recommended.forYou")}
      </h1>

      {searchBasedVideos.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Search className="w-5 h-5 text-night-cyan" />
            <h2 className="text-xl font-serif font-bold text-white">
              {t("recommended.becauseSearched")}{" "}
              <span className="text-night-cyan">"{searchedKeywords}"</span>...
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {searchBasedVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-12">
        <h2 className="text-xl font-serif font-bold text-white mb-6">
          {t("recommended.basedOnHistory")}
        </h2>
        {recommendedVideos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {recommendedVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="bg-night-card border border-night-border rounded-xl p-8 text-center text-night-muted">
            <p>{t("recommended.notEnoughData")}</p>
            <p className="mt-2">
              {t("recommended.startWatching")}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
