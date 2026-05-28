import type { Route } from "./+types/admin.moderations";
import { prisma } from "../lib/db.server";
import { requireAdmin } from "../lib/auth.server";
import { useLoaderData, Form, useNavigation } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const pendingVideos = await prisma.video.findMany({
    where: { moderationStatus: "PENDING_REVIEW" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      thumbnail: true,
      moderationScore: true,
      createdAt: true,
    }
  });

  return { pendingVideos };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const videoId = formData.get("videoId") as string;
  const intent = formData.get("intent") as string; // "approve" or "reject"

  if (!videoId || !intent) {
    return new Response("Invalid request", { status: 400 });
  }

  const newStatus = intent === "approve" ? "SAFE" : "REJECTED";

  await prisma.video.update({
    where: { id: videoId },
    data: { moderationStatus: newStatus }
  });

  return { success: true };
}

export default function AdminModerations() {
  const { pendingVideos } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif">Content Moderation</h1>
        <p className="text-night-muted">Review videos flagged by AI Moderation.</p>
      </div>

      <Card className="bg-night-card border-night-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Pending Review
          </CardTitle>
          <CardDescription className="text-night-muted">
            Videos with high AI unsafe probability score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingVideos.length === 0 ? (
            <div className="text-center py-12 text-night-muted">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
              <p>No videos pending review.</p>
              <p className="text-sm">All AI checks passed.</p>
            </div>
          ) : (
            <div className="rounded-md border border-night-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-night-border hover:bg-transparent">
                    <TableHead>Video</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingVideos.map((video) => (
                    <TableRow key={video.id} className="border-night-border hover:bg-night-hover">
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <img 
                            src={video.thumbnail} 
                            alt={video.title} 
                            className="w-16 h-12 object-cover rounded bg-night-bg"
                          />
                          <span className="font-medium text-white">{video.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-orange-500 border-orange-500/50">
                          {(video.moderationScore || 0).toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-night-muted text-sm">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Form method="post">
                            <input type="hidden" name="videoId" value={video.id} />
                            <input type="hidden" name="intent" value="approve" />
                            <Button 
                              type="submit" 
                              variant="outline" 
                              size="sm"
                              className="text-green-500 border-green-500/50 hover:bg-green-500/10"
                              disabled={isSubmitting}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          </Form>
                          <Form method="post">
                            <input type="hidden" name="videoId" value={video.id} />
                            <input type="hidden" name="intent" value="reject" />
                            <Button 
                              type="submit" 
                              variant="outline" 
                              size="sm"
                              className="text-red-500 border-red-500/50 hover:bg-red-500/10"
                              disabled={isSubmitting}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </Form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
