import { useState } from "react";
import { Player4Me } from "./Player4Me";
import { Filemoon } from "./Filemoon";
import { Doodstream } from "./Doodstream";
import { Button } from "../ui/button";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

interface VideoSource {
  platform: string;
  videoId: string;
}

interface FallbackPlayerProps {
  sources: VideoSource[];
  title: string;
}

export function FallbackPlayer({ sources, title }: FallbackPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedSources, setFailedSources] = useState<Set<number>>(new Set());

  if (!sources || sources.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-night-card text-night-muted">
        <AlertTriangle className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-lg font-medium">No video sources available</p>
      </div>
    );
  }

  const handleError = () => {
    setFailedSources((prev) => new Set([...prev, currentIndex]));
    // Try next source automatically
    const nextIndex = currentIndex + 1;
    if (nextIndex < sources.length) {
      setCurrentIndex(nextIndex);
    }
  };

  const currentSource = sources[currentIndex];
  const allFailed = failedSources.size >= sources.length;

  if (allFailed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-night-card text-night-muted gap-3">
        <AlertTriangle className="w-12 h-12 text-red-500 opacity-70" />
        <p className="text-lg font-medium">All sources failed</p>
        <Button
          variant="outline"
          className="border-night-border text-night-muted hover:bg-night-hover"
          onClick={() => {
            setFailedSources(new Set());
            setCurrentIndex(0);
          }}
        >
          Retry All
        </Button>
      </div>
    );
  }

  const renderPlayer = () => {
    switch (currentSource.platform) {
      case "player4me":
        return <Player4Me videoId={currentSource.videoId} title={title} onError={handleError} />;
      case "filemoon":
        return <Filemoon videoId={currentSource.videoId} title={title} onError={handleError} />;
      case "doodstream":
        return <Doodstream videoId={currentSource.videoId} title={title} onError={handleError} />;
      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-night-card text-night-muted">
            <p>Unknown platform: {currentSource.platform}</p>
          </div>
        );
    }
  };

  return (
    <div className="relative w-full h-full">
      {renderPlayer()}

      {/* Source indicator */}
      {sources.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-white/20"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium">
            Source {currentIndex + 1}/{sources.length}
            <span className="ml-1.5 text-night-muted capitalize">({currentSource.platform})</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-white/20"
            disabled={currentIndex >= sources.length - 1}
            onClick={() => setCurrentIndex((i) => Math.min(sources.length - 1, i + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
