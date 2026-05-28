import type { Route } from "./+types/bookmarks";
import { requireUserId } from "../lib/auth.server";
import { prisma } from "../lib/db.server";
import { VideoCard } from "../components/VideoCard";
import { useLoaderData } from "react-router";
import { useTranslation } from "~/context/I18nContext";

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
  const { t } = useTranslation();
  const { bookmarks } = useLoaderData<typeof loader>();

  return (
    <main className="container mx-auto px-4 py-8 min-h-[80vh]">
      <div className="mb-8 border-b border-night-border pb-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">
          {t("bookmarks.title")} <span className="text-night-accent">{t("bookmarks.highlight")}</span>
        </h1>
        <p className="text-night-muted">
          {t("bookmarks.subtitle")}
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
          <h3 className="text-xl text-night-muted">{t("bookmarks.noResults")}</h3>
          <p className="text-night-muted/60 mt-2">{t("bookmarks.startSaving")}</p>
        </div>
      )}
    </main>
  );
}
