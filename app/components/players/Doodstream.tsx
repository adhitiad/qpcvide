interface DoodstreamProps {
  videoId: string;
  title?: string;
  className?: string;
  onError?: () => void;
}

export function Doodstream({ videoId, title, className, onError }: DoodstreamProps) {
  return (
    <div className={`relative aspect-video rounded-lg bg-night-card overflow-hidden border border-night-border ${className ?? ""}`}>
      <iframe
        title={title ?? "Doodstream Video Player"}
        src={`https://dood.la/e/${videoId}`}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        sandbox="allow-same-origin allow-scripts allow-popups"
        referrerPolicy="no-referrer"
        onError={onError}
      />
    </div>
  );
}
