import { useEffect, useState, useRef } from "react";
import { useFetcher } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { getBrowserClient } from "~/lib/supabase.client";
import { useTranslation } from "~/context/I18nContext";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
}

interface CommentSectionProps {
  videoId: string;
  initialComments: Comment[];
  isLoggedIn: boolean;
}

export function CommentSection({ videoId, initialComments, isLoggedIn }: CommentSectionProps) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const fetcher = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);
  
  // Update state when initial comments change (e.g. navigation)
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Handle Supabase Realtime
  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return; // Disable realtime if credentials missing

    const channel = supabase
      .channel(`comments:${videoId}`)
      .on("broadcast", { event: "NEW_COMMENT" }, (payload) => {
        const newComment = payload.payload as Comment;
        if (newComment) {
          setComments((prev) => {
            // Prevent duplicates
            if (prev.some((c) => c.id === newComment.id)) return prev;
            return [newComment, ...prev];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId]);

  // Clear form on successful fetcher submit
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && (fetcher.data as any).success) {
      formRef.current?.reset();
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <div className="bg-night-card p-6 rounded-2xl border border-night-border mt-8 shadow-lg">
      <h3 className="text-2xl font-serif font-bold mb-6">{t("comment.title", { count: comments.length })}</h3>

      {isLoggedIn ? (
        <fetcher.Form method="post" action="/api/comments" ref={formRef} className="mb-8 flex gap-4">
          <input type="hidden" name="videoId" value={videoId} />
          <div className="flex-1">
            <Input
              name="content"
              placeholder={t("comment.placeholder")}
              className="bg-night-bg border-night-border text-white w-full"
              required
              minLength={3}
              maxLength={1000}
            />
            {fetcher.data && (fetcher.data as any).errors?.content && (
              <p className="text-night-danger text-sm mt-1">{(fetcher.data as any).errors.content[0]}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={fetcher.state !== "idle"}
            className="bg-night-accent hover:bg-night-accent-light text-white"
          >
            {fetcher.state !== "idle" ? t("comment.posting") : t("comment.post")}
          </Button>
        </fetcher.Form>
      ) : (
        <div className="mb-8 p-4 bg-night-bg border border-night-border rounded-lg text-center text-night-muted">
          {t("comment.loginPrompt").split(t("comment.login"))[0]}
          <a href={`/login?redirectTo=/video/${videoId}`} className="text-night-cyan hover:underline">{t("comment.login")}</a>
          {t("comment.loginPrompt").split(t("comment.login"))[1]}
        </div>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <Avatar className="w-10 h-10 border border-night-border">
              <AvatarFallback className="bg-night-hover text-night-text uppercase">
                {comment.user.username.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-night-text">{comment.user.username}</span>
                <span className="text-xs text-night-muted">
                  {new Date(comment.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
              <p className="text-night-muted whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-night-muted py-8">{t("comment.noComments")}</p>
        )}
      </div>
    </div>
  );
}
