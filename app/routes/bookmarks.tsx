import type { Route } from "./+types/bookmarks";
import { requireUserId } from "../lib/auth.server";
import { prisma } from "../lib/db.server";
import { VideoCard } from "../components/VideoCard";
import { useLoaderData } from "react-router";

export const meta = () => {
  return [
    { title: "Bookmarks - Video Hub" },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      video: {
        include: { tags: { include: { tag: true } } },
      },
    },
  });

  return { bookmarks };
}

export default function BookmarksPage() {
  const { bookmarks } = useLoaderData<typeof loader>();

  return (
    <main className="container mx-auto px-4 py-8 min-h-[80vh]">
      <div className="mb-8 border-b border-night-border pb-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">
          Your <span className="text-night-accent">Bookmarks</span>
        </h1>
        <p className="text-night-muted">
          Videos you saved for later.
        </p>
      </div>

      {bookmarks.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {bookmarks.map((b) => (
            <VideoCard key={b.id} video={b.video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-night-card rounded-xl border border-night-border">
          <h3 className="text-xl text-night-muted">No bookmarks found</h3>
          <p className="text-night-muted/60 mt-2">Start saving videos you like!</p>
        </div>
      )}
    </main>
  );
}
