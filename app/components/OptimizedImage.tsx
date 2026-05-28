interface OptimizedImageProps {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  fetchPriority?: "high" | "low" | "auto";
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
}

const WIDTHS = [320, 480, 640, 768, 1024, 1280];

function isSupabaseStorageUrl(url: string): boolean {
  return url.includes("supabase.co/storage") || url.includes("supabase.in/storage");
}

function buildSrcSet(src: string): string {
  if (!isSupabaseStorageUrl(src)) return "";

  return WIDTHS.map((w) => {
    const separator = src.includes("?") ? "&" : "?";
    return `${src}${separator}width=${w}&quality=75 ${w}w`;
  }).join(", ");
}

export function OptimizedImage({
  src,
  alt,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  className,
  fetchPriority = "auto",
  loading = "lazy",
  decoding = "async",
}: OptimizedImageProps) {
  const srcSet = buildSrcSet(src);

  return (
    <img
      src={src}
      alt={alt}
      srcSet={srcSet || undefined}
      sizes={srcSet ? sizes : undefined}
      className={className}
      fetchPriority={fetchPriority}
      loading={loading}
      decoding={decoding}
    />
  );
}
