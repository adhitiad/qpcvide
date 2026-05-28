import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { VideoCard } from "../components/VideoCard";
import { Sparkles, Search, Loader2, Bot } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export const meta = () => {
  return [
    { title: "AI Semantic Search | Auiso" },
    {
      name: "description",
      content: "Search videos using AI-powered semantic understanding.",
    },
  ];
};

export default function SearchAIPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [videos, setVideos] = useState<any[]>([]);
  const [expandedKeywords, setExpandedKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [exaContext, setExaContext] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(
        `/api/search-ai?q=${encodeURIComponent(searchQuery)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
        setExpandedKeywords(data.expandedKeywords || []);
        setExaContext(data.exaContext || false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      performSearch(query.trim());
    }
  };

  return (
    <main className="container mx-auto px-4 py-12 min-h-[80vh]">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-night-card border border-night-border rounded-full mb-6 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
          <Bot className="w-12 h-12 text-night-accent" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
          AI Semantic Search
        </h1>
        <p className="text-night-muted text-lg mb-8">
          Type a concept, mood, or complex scenario. Our AI will understand the
          context and find the most relevant videos using Exa's semantic engine.
        </p>

        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-2xl mx-auto"
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. A romantic story with a tragic ending..."
            className="w-full h-16 pl-6 pr-32 rounded-full bg-night-card border-2 border-night-border text-lg text-white placeholder:text-night-muted/50 focus-visible:border-night-accent focus-visible:ring-1 focus-visible:ring-night-accent transition-all"
          />
          <Button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 rounded-full px-6 bg-night-accent hover:bg-night-accent-light text-white font-bold transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2" />
            )}
            {loading ? "Thinking..." : "Search"}
          </Button>
        </form>
      </div>

      {hasSearched && (
        <div className="mt-16">
          <div className="mb-8 border-b border-night-border pb-6">
            <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
              <Search className="w-6 h-6 text-night-cyan" />
              Results for "{query}"
            </h2>

            {expandedKeywords.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-night-muted">
                  AI expanded your search with:
                </span>
                {expandedKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-night-card border border-night-accent/30 text-night-accent rounded-full font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {exaContext && (
              <div className="mt-2 text-xs text-green-400 font-medium">
                ✓ Powered by Exa Semantic Context
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-video bg-night-card animate-pulse rounded-xl border border-night-border"
                ></div>
              ))}
            </div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video as any} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-night-card rounded-xl border border-night-border">
              <Bot className="w-16 h-16 mx-auto text-night-muted mb-4 opacity-50" />
              <h3 className="text-xl text-night-muted font-serif">
                No semantic matches found
              </h3>
              <p className="text-night-muted/60 mt-2">
                Try describing your intent differently.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
