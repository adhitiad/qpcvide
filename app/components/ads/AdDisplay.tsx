import { useEffect } from "react";
import { useFetcher } from "react-router";

interface AdDisplayProps {
  position: string;
  className?: string;
}

export function AdDisplay({ position, className }: AdDisplayProps) {
  const fetcher = useFetcher<any>();
  const trackFetcher = useFetcher();

  useEffect(() => {
    // Load the ad for this position
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load(`/api/ads/serve?position=${position}`);
    }
  }, [fetcher, position]);

  const ad = fetcher.data;

  useEffect(() => {
    if (ad && ad.id) {
      // Record an impression when the ad is loaded and displayed
      trackFetcher.submit(
        { purchaseId: ad.id, type: "impression" },
        { method: "POST", action: "/api/ads/track", encType: "application/json" }
      );
    }
    // Only run when a new ad is fetched
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad?.id]);

  if (!ad) {
    return null; // Return nothing if no active ad
  }

  const handleClick = () => {
    trackFetcher.submit(
      { purchaseId: ad.id, type: "click" },
      { method: "POST", action: "/api/ads/track", encType: "application/json" }
    );
  };

  return (
    <div className={`my-4 flex justify-center ${className || ""}`}>
      <a 
        href={ad.targetUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block rounded-lg overflow-hidden border border-night-border hover:opacity-90 transition-opacity max-w-full"
      >
        <img 
          src={ad.bannerUrl} 
          alt={`Ad - ${ad.advertiserName}`} 
          className="w-full h-auto object-cover max-h-64"
        />
        <div className="text-[10px] text-right p-1 bg-night-bg/50 text-night-muted absolute mt-[-20px] ml-2 rounded-tr-md">
          Ad
        </div>
      </a>
    </div>
  );
}
