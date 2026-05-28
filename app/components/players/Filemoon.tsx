interface FilemoonProps {
  videoId: string;
  title?: string;
  className?: string;
  onError?: () => void;
}

export function Filemoon({ videoId, title, className, onError }: FilemoonProps) {
  return (
    <div className={`relative aspect-video rounded-lg bg-night-card overflow-hidden border border-night-border ${className ?? ""}`}>
      <iframe
        title={title ?? "Filemoon Video Player"}
        src={`https://filemoon.sx/e/${videoId}`}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        sandbox="allow-same-origin allow-scripts allow-popups"
        referrerPolicy="no-referrer"
        onError={onError}
      />
    </div>
  );
}
