import type { Route } from "./+types/admin.ads.purchases";
import { Link, useLoaderData, useFetcher } from "react-router";
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
import { Check, X, ArrowLeft } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") || "PENDING";

  const purchases = await prisma.adPurchase.findMany({
    where: { status: statusFilter },
    include: { slot: true },
    orderBy: { createdAt: "desc" },
  });

  return { purchases, statusFilter };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const intent = formData.get("intent") as string;

  if (intent === "approve") {
    await prisma.adPurchase.update({
      where: { id },
      data: { status: "APPROVED", active: true },
    });
  } else if (intent === "reject") {
    await prisma.adPurchase.update({
      where: { id },
      data: { status: "REJECTED", active: false },
    });
  }

  return { success: true };
}

export default function AdminAdsPurchases() {
  const { purchases, statusFilter } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hover:bg-night-hover"
            >
              <Link to="/admin/ads">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Slots
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Ad Purchases Review</h1>
          <p className="text-night-muted">
            Review and approve self-serve ad submissions.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={statusFilter === "PENDING" ? "default" : "outline"}
            asChild
            className={
              statusFilter === "PENDING"
                ? "bg-night-accent"
                : "border-night-border"
            }
          >
            <Link to="?status=PENDING">Pending</Link>
          </Button>
          <Button
            variant={statusFilter === "APPROVED" ? "default" : "outline"}
            asChild
            className={
              statusFilter === "APPROVED"
                ? "bg-night-success"
                : "border-night-border"
            }
          >
            <Link to="?status=APPROVED">Approved</Link>
          </Button>
          <Button
            variant={statusFilter === "REJECTED" ? "default" : "outline"}
            asChild
            className={
              statusFilter === "REJECTED"
                ? "bg-night-danger"
                : "border-night-border"
            }
          >
            <Link to="?status=REJECTED">Rejected</Link>
          </Button>
        </div>
      </div>

      <div className="bg-night-card border border-night-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table>
          <TableHeader className="bg-night-hover">
            <TableRow className="border-night-border">
              <TableHead className="text-night-muted">Advertiser</TableHead>
              <TableHead className="text-night-muted">Banner</TableHead>
              <TableHead className="text-night-muted">Target URL</TableHead>
              <TableHead className="text-night-muted">Slot</TableHead>
              <TableHead className="text-night-muted">Duration</TableHead>
              <TableHead className="text-night-muted text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((p: any) => (
              <TableRow
                key={p.id}
                className="border-night-border hover:bg-night-hover/50"
              >
                <TableCell className="font-medium text-white">
                  {p.advertiserName}
                </TableCell>
                <TableCell>
                  <a href={p.bannerUrl} target="_blank" rel="noreferrer">
                    <img
                      src={p.bannerUrl}
                      alt="Banner"
                      className="h-12 w-auto object-cover rounded border border-night-border hover:opacity-80 transition-opacity"
                    />
                  </a>
                </TableCell>
                <TableCell>
                  <a
                    href={p.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-night-cyan hover:underline line-clamp-1 max-w-[150px]"
                  >
                    {p.targetUrl}
                  </a>
                </TableCell>
                <TableCell className="text-night-muted">
                  {p.slot.name}
                </TableCell>
                <TableCell className="text-night-muted">
                  {new Date(p.startDate).toLocaleDateString()} -{" "}
                  {new Date(p.endDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {p.status === "PENDING" && (
                    <div className="flex justify-end gap-2">
                      <fetcher.Form method="post">
                        <input type="hidden" name="intent" value="approve" />
                        <input type="hidden" name="id" value={p.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-night-success hover:bg-night-success/20 hover:text-night-success"
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      </fetcher.Form>
                      <fetcher.Form method="post">
                        <input type="hidden" name="intent" value="reject" />
                        <input type="hidden" name="id" value={p.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-night-danger hover:bg-night-danger/20 hover:text-night-danger"
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </fetcher.Form>
                    </div>
                  )}
                  {p.status !== "PENDING" && (
                    <span
                      className={`text-sm font-bold ${p.status === "APPROVED" ? "text-night-success" : "text-night-danger"}`}
                    >
                      {p.status}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {purchases.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-night-muted"
                >
                  No {statusFilter.toLowerCase()} purchases found.
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
