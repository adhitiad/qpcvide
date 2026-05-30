interface Player4MeProps {
  videoId: string;
  title?: string;
  className?: string;
  onError?: () => void;
}

export function Player4Me({
  videoId,
  title,
  className,
  onError,
}: Player4MeProps) {
  return (
    <div
      className={`relative aspect-video rounded-lg bg-night-card overflow-hidden border border-night-border ${className ?? ""}`}
    >
      <iframe
        title={title ?? "Player4Me Video Player"}
        src={`https://404.4meplayer.com/#${videoId}`}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        sandbox="allow-same-origin allow-scripts allow-popups"
        referrerPolicy="no-referrer"
        onError={onError}
      />
    </div>
  );
}
