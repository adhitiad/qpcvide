import type { Route } from "./+types/admin.categories";
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
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { videos: true } }
    },
    orderBy: { name: "asc" }
  });
  return { categories };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = formData.get("name") as string;
    if (name.trim()) {
      try {
        const trimmedName = name.trim();
        await prisma.category.create({ 
          data: { 
            name: trimmedName,
            slug: trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            type: "genre"
          } 
        });
      } catch (e) {
        return { error: "Category already exists" };
      }
    }
  } else if (intent === "delete") {
    const name = formData.get("name") as string;
    await prisma.category.delete({ where: { name } });
  }

  return { success: true };
}

export default function AdminCategories() {
  const { categories } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories Management</h1>
          <p className="text-night-muted">Manage main categories (BDSM, MILF, etc).</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-night-accent hover:bg-night-accent-light text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-night-card border-night-border text-white">
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <fetcher.Form 
              method="post" 
              className="space-y-4"
              onSubmit={() => {
                setTimeout(() => setIsOpen(false), 100);
              }}
            >
              <input type="hidden" name="intent" value="create" />
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input id="name" name="name" required placeholder="e.g. BDSM" className="bg-night-bg border-night-border" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="bg-night-accent hover:bg-night-accent-light text-white" disabled={fetcher.state !== "idle"}>
                  {fetcher.state !== "idle" ? "Saving..." : "Save Category"}
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
              <TableHead className="text-night-muted">Category Name</TableHead>
              <TableHead className="text-night-muted">Linked Video</TableHead>
              <TableHead className="text-night-muted text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.name} className="border-night-border hover:bg-night-hover/50">
                <TableCell className="font-medium text-white">{cat.name}</TableCell>
                <TableCell className="text-night-muted">{cat._count.videos}</TableCell>
                <TableCell className="text-right">
                  <fetcher.Form method="post" onSubmit={(e) => {
                    if (!confirm("Delete this category?")) e.preventDefault();
                  }}>
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="name" value={cat.name} />
                    <Button type="submit" variant="ghost" size="sm" className="text-night-danger hover:bg-night-danger/20 hover:text-night-danger">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </fetcher.Form>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-night-muted">
                  No categories found.
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
