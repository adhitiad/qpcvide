import { useFetcher } from "react-router";
import { Button } from "./ui/button";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  videoId: string;
  initialLiked: boolean;
  likeCount: number;
}

export function LikeButton({ videoId, initialLiked, likeCount }: LikeButtonProps) {
  const fetcher = useFetcher();
  
  // Optimistic UI calculation
  let isLiked = initialLiked;
  let count = likeCount;

  if (fetcher.formData) {
    const isLiking = fetcher.formData.get("type") === "like";
    // If the intent is "like", we toggle the optimistic state
    // But wait, the form simply submits type="like", it doesn't say "unlike".
    // So the server toggles it. Optimistically, we assume the opposite of current state.
    isLiked = !initialLiked;
    count = isLiked ? count + 1 : count - 1;
  } else if (fetcher.data && "liked" in (fetcher.data as any)) {
    // Once fetcher completes, it will eventually revalidate the loader.
    // If we want immediate feedback before revalidation, we can read fetcher.data
  }

  return (
    <fetcher.Form method="post" action="/api/interact">
      <input type="hidden" name="type" value="like" />
      <input type="hidden" name="videoId" value={videoId} />
      <Button
        type="submit"
        variant="outline"
        className={`gap-2 border-night-border hover:bg-night-hover ${
          isLiked ? "text-night-danger border-night-danger/50" : "text-night-muted"
        }`}
      >
        <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
        <span>{count > 0 ? count.toLocaleString("id-ID") : "Like"}</span>
      </Button>
    </fetcher.Form>
  );
}
