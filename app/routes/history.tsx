import type { Route } from "./+types/history";
import { requireUserId } from "../lib/auth.server";
import { prisma } from "../lib/db.server";
import { VideoCard } from "../components/VideoCard";
import { useLoaderData } from "react-router";

export const meta = () => {
  return [
    { title: "Watch History - Video Hub" },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);

  const history = await prisma.watchHistory.findMany({
    where: { userId },
    orderBy: { watchedAt: "desc" },
    include: {
      video: {
        include: { tags: { include: { tag: true } } },
      },
    },
  });

  return { history };
}

export default function HistoryPage() {
  const { history } = useLoaderData<typeof loader>();

  return (
    <main className="container mx-auto px-4 py-8 min-h-[80vh]">
      <div className="mb-8 border-b border-night-border pb-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">
          Watch <span className="text-night-accent">History</span>
        </h1>
        <p className="text-night-muted">
          Your recently watched videos.
        </p>
      </div>

      {history.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {history.map((h) => (
            <VideoCard key={h.id} video={h.video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-night-card rounded-xl border border-night-border">
          <h3 className="text-xl text-night-muted">No history found</h3>
          <p className="text-night-muted/60 mt-2">Start watching some videos!</p>
        </div>
      )}
    </main>
  );
}
