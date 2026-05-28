import { useEffect, useState } from "react";
import { getBrowserClient } from "~/lib/supabase.client";

interface VideoPlayerProps {
  videoId: string;
  peerTubeId?: string | null;
  externalSourceUrl?: string | null;
  initialLiveStatus?: boolean;
}

export function VideoPlayer({ videoId, peerTubeId, externalSourceUrl, initialLiveStatus = false }: VideoPlayerProps) {
  const [isLive, setIsLive] = useState(initialLiveStatus);

  useEffect(() => {
    // Setup Supabase Realtime for streaming status updates
    const supabase = getBrowserClient();

    const channel = supabase
      .channel(`stream:${videoId}`)
      .on("broadcast", { event: "STREAM_STATUS" }, (payload) => {
        if (payload.payload?.videoId === videoId) {
          setIsLive(payload.payload.isLive);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId]);

  if (!peerTubeId && !externalSourceUrl) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center text-night-muted">
        <p className="mb-2">No video source available.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      {/* Live Badge */}
      {isLive && (
        <div className="absolute top-4 right-4 z-10 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg animate-pulse">
          LIVE
        </div>
      )}

      {peerTubeId ? (
        <iframe
          title="PeerTube Video Player"
          src={`https://peertube2.cpy.re/videos/embed/${peerTubeId}?api=1`}
          frameBorder="0"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-popups"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-night-card">
          <p className="text-night-muted mb-4">Video is hosted externally.</p>
          <a
            href={externalSourceUrl as string}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-night-accent hover:bg-night-accent-light text-white rounded font-bold transition-colors"
          >
            Watch External Source
          </a>
        </div>
      )}
    </div>
  );
}
