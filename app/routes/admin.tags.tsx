import type { Route } from "./+types/admin.tags";
import { useState } from "react";
import { useLoaderData, useFetcher, Form, Link } from "react-router";
import { requireAdmin } from "../lib/auth.server";
import { prisma } from "../lib/db.server";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const tags = await prisma.tag.findMany({
    include: {
      _count: { select: { videos: true } }
    },
    orderBy: { name: "asc" }
  });
  return { tags };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = formData.get("name") as string;
    if (name.trim()) {
      try {
        await prisma.tag.create({ data: { name: name.trim() } });
      } catch (e) {
        // likely unique constraint violation
        return { error: "Tag already exists" };
      }
    }
  } else if (intent === "delete") {
    const name = formData.get("name") as string;
    await prisma.tag.delete({ where: { name } });
  }

  return { success: true };
}

export default function AdminTags() {
  const { tags } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tags Management</h1>
          <p className="text-night-muted">Organize content tags.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-night-accent hover:bg-night-accent-light text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add New Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-night-card border-night-border text-white">
            <DialogHeader>
              <DialogTitle>Create Tag</DialogTitle>
            </DialogHeader>
            <fetcher.Form 
              method="post" 
              className="space-y-4"
              onSubmit={() => {
                // We could do a more reliable close on success, but this is simple enough
                setTimeout(() => setIsOpen(false), 100);
              }}
            >
              <input type="hidden" name="intent" value="create" />
              <div className="space-y-2">
                <Label htmlFor="name">Tag Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Action" className="bg-night-bg border-night-border" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="bg-night-accent hover:bg-night-accent-light text-white" disabled={fetcher.state !== "idle"}>
                  {fetcher.state !== "idle" ? "Saving..." : "Save Tag"}
                </Button>
              </div>
            </fetcher.Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-night-card border border-night-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table>
          <TableHeader className="bg-night-hover">
            <TableRow className="border-night-border">
              <TableHead className="text-night-muted">Tag Name</TableHead>
              <TableHead className="text-night-muted">Linked Video</TableHead>
              <TableHead className="text-night-muted text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((tag) => (
              <TableRow key={tag.name} className="border-night-border hover:bg-night-hover/50">
                <TableCell className="font-medium text-white">{tag.name}</TableCell>
                <TableCell className="text-night-muted">{tag._count.videos}</TableCell>
                <TableCell className="text-right">
                  <fetcher.Form method="post" onSubmit={(e) => {
                    if (!confirm("Delete this tag?")) e.preventDefault();
                  }}>
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="name" value={tag.name} />
                    <Button type="submit" variant="ghost" size="sm" className="text-night-danger hover:bg-night-danger/20 hover:text-night-danger">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </fetcher.Form>
                </TableCell>
              </TableRow>
            ))}
            {tags.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-night-muted">
                  No tags found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
