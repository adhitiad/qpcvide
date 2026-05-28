import type { Route } from "./+types/index";
import { Link, useLoaderData, useFetcher, useNavigate } from "react-router";
import { requireAdmin } from "../../../lib/auth.server";
import { prisma } from "../../../lib/db.server";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../../components/ui/pagination";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const search = url.searchParams.get("search") || "";
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { synopsis: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.video.count({ where }),
  ]);

  return {
    videos,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    search,
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const intent = formData.get("intent");

  if (intent === "delete" && id) {
    await prisma.video.delete({ where: { id } });
    return { success: true };
  }

  return { success: false, error: "Invalid intent" };
}

export default function AdminVideosIndex({ loaderData }: Route.ComponentProps) {
  const { videos, totalPages, page, search } = loaderData;
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("search") as string;
    const searchParams = new URLSearchParams();
    if (q) searchParams.set("search", q);
    searchParams.set("page", "1");
    navigate(`?${searchParams.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-serif font-bold tracking-wide">
          Video Management
        </h1>
        <Button
          asChild
          className="bg-night-accent hover:bg-night-accent/90 text-white"
        >
          <Link to="/admin/videos/new">
            <Plus className="w-4 h-4 mr-2" />
            Upload Video
          </Link>
        </Button>
      </div>

      <div className="bg-night-card border border-night-border rounded-lg p-4">
        <form onSubmit={handleSearch} className="flex max-w-sm gap-2">
          <Input
            name="search"
            placeholder="Search videos..."
            defaultValue={search}
            className="bg-night-bg border-night-border"
          />
          <Button type="submit" variant="secondary" className="bg-night-hover">
            <Search className="w-4 h-4" />
          </Button>
        </form>
      </div>

      <div className="bg-night-card border border-night-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-night-border hover:bg-night-hover/50">
              <TableHead className="w-[100px]">Thumbnail</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.length === 0 ? (
              <TableRow className="border-night-border hover:bg-night-hover/50">
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-night-muted"
                >
                  No videos found.
                </TableCell>
              </TableRow>
            ) : (
              videos.map((video: any) => (
                <TableRow
                  key={video.id}
                  className="border-night-border hover:bg-night-hover/50"
                >
                  <TableCell>
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-16 h-10 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="line-clamp-1">{video.title}</div>
                    {video.isFeatured && (
                      <Badge
                        variant="outline"
                        className="text-[10px] mt-1 border-night-accent text-night-accent"
                      >
                        Featured
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {video.categories.map((cv: any) => (
                        <Badge
                          key={cv.categoryId}
                          variant="secondary"
                          className="bg-night-hover text-xs"
                        >
                          {cv.category.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{video.views}</TableCell>
                  <TableCell>
                    {new Date(video.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="text-night-cyan hover:text-white hover:bg-night-hover"
                    >
                      <Link to={`/admin/videos/${video.id}/edit`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    <fetcher.Form
                      method="post"
                      className="inline-block"
                      onSubmit={(e) => {
                        if (
                          !confirm(
                            "Are you sure you want to delete this video?",
                          )
                        )
                          e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={video.id} />
                      <Button
                        variant="ghost"
                        size="icon"
                        type="submit"
                        name="intent"
                        value="delete"
                        className="text-red-500 hover:text-white hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </fetcher.Form>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href={`?page=${page - 1}${search ? `&search=${search}` : ""}`}
                  className="text-night-text hover:bg-night-hover"
                />
              </PaginationItem>
            )}

            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              // Show limited pages logic can go here if many pages exist
              if (
                p === 1 ||
                p === totalPages ||
                (p >= page - 1 && p <= page + 1)
              ) {
                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href={`?page=${p}${search ? `&search=${search}` : ""}`}
                      isActive={p === page}
                      className={
                        p === page
                          ? "bg-night-accent border-night-accent hover:bg-night-accent/90 hover:text-white"
                          : "text-night-text hover:bg-night-hover"
                      }
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              return null;
            })}

            {page < totalPages && (
              <PaginationItem>
                <PaginationNext
                  href={`?page=${page + 1}${search ? `&search=${search}` : ""}`}
                  className="text-night-text hover:bg-night-hover"
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
