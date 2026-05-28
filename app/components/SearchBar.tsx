import { useState, useEffect, useRef } from "react";
import { useFetcher, useNavigate, Form } from "react-router";
import { Search, Loader2 } from "lucide-react";
import { Input } from "./ui/input";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const fetcher = useFetcher<any[]>();
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        fetcher.load(`/api/search?q=${encodeURIComponent(query)}`);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (slug: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/video/${slug}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setQuery("");
    }
  };

  const results = fetcher.data || [];
  const isLoading = fetcher.state === "loading";

  return (
    <div ref={wrapperRef} className="relative w-full max-w-sm">
      <form onSubmit={handleSubmit} className="relative">
        <Input
          type="text"
          placeholder="Search video..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-night-card border-night-border text-white pl-10 pr-4 rounded-full focus-visible:ring-night-accent"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-night-muted">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
      </form>

      {isOpen && (query.trim().length >= 2) && (
        <div className="absolute top-full mt-2 w-full bg-night-card border border-night-border rounded-xl shadow-xl overflow-hidden z-50">
          {results.length > 0 ? (
            <ul>
              {results.map((video) => (
                <li key={video.id}>
                  <button
                    onClick={() => handleSelect(video.slug)}
                    className="w-full text-left px-4 py-3 hover:bg-night-hover flex items-center gap-3 transition-colors"
                  >
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-10 h-10 object-cover rounded"
                    />
                    <span className="text-white text-sm font-medium line-clamp-2">
                      {video.title}
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate(`/search?q=${encodeURIComponent(query)}`);
                    setQuery("");
                  }}
                  className="w-full text-center px-4 py-2 bg-night-hover text-night-cyan text-sm font-bold"
                >
                  View all results
                </button>
              </li>
            </ul>
          ) : !isLoading ? (
            <div className="px-4 py-3 text-night-muted text-sm text-center">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
