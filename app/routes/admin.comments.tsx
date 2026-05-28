import type { Route } from "./+types/admin.comments";
import { useLoaderData, useFetcher } from "react-router";
import { requireAdmin } from "../lib/auth.server";
import { prisma } from "../lib/db.server";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Trash2 } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = 20;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { username: true } },
        video: { select: { title: true, slug: true } }
      }
    }),
    prisma.comment.count()
  ]);

  return { comments, total, page, totalPages: Math.ceil(total / limit) };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const id = formData.get("id") as string;

  if (id) {
    await prisma.comment.delete({ where: { id } });
  }

  return { success: true };
}

export default function AdminComments() {
  const { comments, total, page, totalPages } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comments Moderation</h1>
        <p className="text-night-muted">Total {total} comments.</p>
      </div>

      <div className="bg-night-card border border-night-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table>
          <TableHeader className="bg-night-hover">
            <TableRow className="border-night-border">
              <TableHead className="text-night-muted w-1/4">User</TableHead>
              <TableHead className="text-night-muted w-1/2">Content</TableHead>
              <TableHead className="text-night-muted text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.map((comment) => (
              <TableRow key={comment.id} className="border-night-border hover:bg-night-hover/50">
                <TableCell className="font-medium text-white">
                  {comment.user.username}
                  <div className="text-xs text-night-muted mt-1">on {comment.video.title}</div>
                </TableCell>
                <TableCell className="text-night-muted">
                  <p className="line-clamp-2">{comment.content}</p>
                  <span className="text-xs opacity-50">{new Date(comment.createdAt).toLocaleString()}</span>
                </TableCell>
                <TableCell className="text-right">
                  <fetcher.Form method="post" onSubmit={(e) => {
                    if (!confirm("Delete this comment?")) e.preventDefault();
                  }}>
                    <input type="hidden" name="id" value={comment.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-night-danger hover:bg-night-danger/20 hover:text-night-danger">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </fetcher.Form>
                </TableCell>
              </TableRow>
            ))}
            {comments.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-night-muted">
                  No comments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {page > 1 && (
          <Button variant="outline" size="sm" asChild>
            <a href={`?page=${page - 1}`}>Previous</a>
          </Button>
        )}
        {page < totalPages && (
          <Button variant="outline" size="sm" asChild>
            <a href={`?page=${page + 1}`}>Next</a>
          </Button>
        )}
      </div>
    </div>
  );
}
