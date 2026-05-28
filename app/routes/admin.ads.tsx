import type { Route } from "./+types/admin.ads";
import { useState } from "react";
import { useLoaderData, useFetcher, Link } from "react-router";
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
  const slots = await prisma.adSlot.findMany({
    include: {
      _count: { select: { purchases: true } }
    },
    orderBy: { name: "asc" }
  });
  return { slots };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = formData.get("name") as string;
    const position = formData.get("position") as string;
    const price = parseFloat(formData.get("price") as string);
    
    if (name && position && !isNaN(price)) {
      await prisma.adSlot.create({
        data: { name, position, price, active: true }
      });
    }
  } else if (intent === "delete") {
    const id = formData.get("id") as string;
    // Disconnect or handle relation before delete in real app, simple delete for now
    await prisma.adSlot.delete({ where: { id } });
  }

  return { success: true };
}

export default function AdminAds() {
  const { slots } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ads Management</h1>
          <p className="text-night-muted">Manage Ad Slots for monetization.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" asChild className="border-night-border text-white hover:bg-night-hover">
            <Link to="/admin/ads/purchases">Review Purchases</Link>
          </Button>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-night-accent hover:bg-night-accent-light text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Ad Slot
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-night-card border-night-border text-white">
            <DialogHeader>
              <DialogTitle>Create New Ad Slot</DialogTitle>
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
                <Label htmlFor="name">Slot Name (e.g. Header Banner)</Label>
                <Input id="name" name="name" required className="bg-night-bg border-night-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position Key (header, sidebar)</Label>
                <Input id="position" name="position" required className="bg-night-bg border-night-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD/day)</Label>
                <Input type="number" step="0.01" id="price" name="price" required className="bg-night-bg border-night-border" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="bg-night-accent hover:bg-night-accent-light text-white" disabled={fetcher.state !== "idle"}>
                  {fetcher.state !== "idle" ? "Saving..." : "Save Slot"}
                </Button>
              </div>
            </fetcher.Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="bg-night-card border border-night-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table>
          <TableHeader className="bg-night-hover">
            <TableRow className="border-night-border">
              <TableHead className="text-night-muted">Name</TableHead>
              <TableHead className="text-night-muted">Position</TableHead>
              <TableHead className="text-night-muted">Price/Day</TableHead>
              <TableHead className="text-night-muted">Purchases</TableHead>
              <TableHead className="text-night-muted text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.map((slot) => (
              <TableRow key={slot.id} className="border-night-border hover:bg-night-hover/50">
                <TableCell className="font-medium text-white">{slot.name}</TableCell>
                <TableCell className="text-night-muted">{slot.position}</TableCell>
                <TableCell className="text-night-success font-medium">${slot.price.toFixed(2)}</TableCell>
                <TableCell className="text-night-muted">{slot._count.purchases}</TableCell>
                <TableCell className="text-right">
                  <fetcher.Form method="post" onSubmit={(e) => {
                    if (!confirm("Delete this Ad Slot?")) e.preventDefault();
                  }}>
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={slot.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-night-danger hover:bg-night-danger/20 hover:text-night-danger">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </fetcher.Form>
                </TableCell>
              </TableRow>
            ))}
            {slots.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-night-muted">
                  No ad slots created yet.
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
