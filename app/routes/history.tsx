import type { Route } from "./+types/history";
import { requireUserId } from "../lib/auth.server";
import { prisma } from "../lib/db.server";
import { VideoCard } from "../components/VideoCard";
import { useLoaderData } from "react-router";
import { useTranslation } from "~/context/I18nContext";

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
  const { t } = useTranslation();
  const { history } = useLoaderData<typeof loader>();

  return (
    <main className="container mx-auto px-4 py-8 min-h-[80vh]">
      <div className="mb-8 border-b border-night-border pb-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">
          {t("history.title")} <span className="text-night-accent">{t("history.highlight")}</span>
        </h1>
        <p className="text-night-muted">
          {t("history.subtitle")}
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
          <h3 className="text-xl text-night-muted">{t("history.noResults")}</h3>
          <p className="text-night-muted/60 mt-2">{t("history.startWatching")}</p>
        </div>
      )}
    </main>
  );
}
