import { useFetcher } from "react-router";
import { Button } from "./ui/button";
import { Bookmark } from "lucide-react";

interface BookmarkButtonProps {
  videoId: string;
  initialBookmarked: boolean;
}

export function BookmarkButton({ videoId, initialBookmarked }: BookmarkButtonProps) {
  const fetcher = useFetcher();
  
  // Optimistic UI calculation
  let isBookmarked = initialBookmarked;

  if (fetcher.formData) {
    isBookmarked = !initialBookmarked;
  }

  return (
    <fetcher.Form method="post" action="/api/interact">
      <input type="hidden" name="type" value="bookmark" />
      <input type="hidden" name="videoId" value={videoId} />
      <Button
        type="submit"
        variant="outline"
        className={`gap-2 border-night-border hover:bg-night-hover ${
          isBookmarked ? "text-night-accent border-night-accent/50" : "text-night-muted"
        }`}
      >
        <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
        <span>{isBookmarked ? "Saved" : "Save"}</span>
      </Button>
    </fetcher.Form>
  );
}
