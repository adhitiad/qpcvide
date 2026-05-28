import type { Route } from "./+types/new";
import { Link, Form, useActionData, useNavigation, useSubmit } from "react-router";
import { useState } from "react";
import { requireAdmin } from "../../../lib/auth.server";
import { prisma } from "../../../lib/db.server";
import { uploadFileToSupabase } from "../../../lib/storage.server";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Checkbox } from "../../../components/ui/checkbox";
import { Switch } from "../../../components/ui/switch";
import { Label } from "../../../components/ui/label";
import { ArrowLeft, Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return { categories };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();

  const title = formData.get("title") as string;
  let slug = formData.get("slug") as string;
  if (!slug) slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const synopsis = formData.get("synopsis") as string;
  const durationStr = formData.get("duration") as string;
  const duration = durationStr ? parseInt(durationStr, 10) : null;
  const videoPlatform = formData.get("videoPlatform") as string;
  const videoId = formData.get("videoId") as string;
  const releaseDateStr = formData.get("releaseDate") as string;
  const releaseDate = releaseDateStr ? new Date(releaseDateStr) : new Date();
  const isFeatured = formData.get("isFeatured") === "on";

  // Tags (comma separated)
  const tagsStr = formData.get("tags") as string;
  const tagNames = tagsStr
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // Categories
  const categoryIds = formData.getAll("categoryIds") as string[];

  // Thumbnail upload
  const thumbnailFile = formData.get("thumbnail") as File;
  let thumbnailUrl = "";

  if (thumbnailFile && thumbnailFile.size > 0) {
    const url = await uploadFileToSupabase(thumbnailFile, "thumbnails");
    if (!url) {
      return { error: "Failed to upload thumbnail to Supabase." };
    }
    thumbnailUrl = url;
  } else {
    return { error: "Thumbnail is required." };
  }

  // Create or connect Tags
  const tagsConnectOrCreate = tagNames.map((name) => ({
    tag: {
      connectOrCreate: {
        where: { name },
        create: { name },
      },
    },
  }));

  // Connect Categories
  const categoriesConnect = categoryIds.map((id) => ({
    categoryId: id,
  }));

  const moderationStatus = formData.get("moderationStatus") as string || "SAFE";
  const moderationScoreStr = formData.get("moderationScore") as string;
  const moderationScore = moderationScoreStr ? parseFloat(moderationScoreStr) : 0;

  try {
    const video = await prisma.video.create({
      data: {
        title,
        slug,
        synopsis,
        thumbnail: thumbnailUrl,
        duration,
        isFeatured,
        videoPlatform,
        videoId,
        releaseDate,
        moderationStatus,
        moderationScore,
        tags: { create: tagsConnectOrCreate },
        categories: { create: categoriesConnect },
      },
    });

    return new Response(null, {
      status: 302,
      headers: { Location: "/admin/videos" },
    });
  } catch (e: any) {
    if (e.code === "P2002") {
      return { error: "A video with this slug already exists." };
    }
    return { error: e.message || "Failed to create video" };
  }
}

export default function AdminVideosNew({ loaderData }: Route.ComponentProps) {
  const { categories } = loaderData;
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
  
  const [isModerating, setIsModerating] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsModerating(true);
    setModerationWarning(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const title = formData.get("title") as string;
    const synopsis = formData.get("synopsis") as string;

    try {
      const res = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${title}\n\n${synopsis}` })
      });
      
      const result = await res.json();
      const score = result.score || 0;
      let status = "SAFE";
      
      if (score > 0.8) {
        status = "PENDING_REVIEW";
        setModerationWarning("Konten ini terdeteksi berpotensi tidak aman. Video akan ditandai sebagai PENDING_REVIEW.");
      }

      formData.append("moderationStatus", status);
      formData.append("moderationScore", score.toString());
      
      submit(formData, { method: "post", encType: "multipart/form-data" });
    } catch (err) {
      console.error("Moderation failed", err);
      // Fallback
      formData.append("moderationStatus", "SAFE");
      formData.append("moderationScore", "0");
      submit(formData, { method: "post", encType: "multipart/form-data" });
    } finally {
      setIsModerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="text-night-muted hover:text-white"
        >
          <Link to="/admin/videos">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-serif font-bold tracking-wide">
          Upload New Video
        </h1>
      </div>

      {actionData?.error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {actionData.error}
        </div>
      )}
      
      {moderationWarning && (
        <div className="p-4 bg-orange-500/10 border border-orange-500 rounded-lg text-orange-500">
          {moderationWarning}
        </div>
      )}

      <Form method="post" encType="multipart/form-data" className="space-y-8" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                required
                className="bg-night-card border-night-border mt-1"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug (Optional)</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="auto-generated-if-empty"
                className="bg-night-card border-night-border mt-1"
              />
            </div>

            <div>
              <Label htmlFor="thumbnail">Thumbnail File</Label>
              <Input
                id="thumbnail"
                name="thumbnail"
                type="file"
                accept="image/*"
                required
                className="bg-night-card border-night-border mt-1 file:text-night-cyan"
              />
            </div>

            <div>
              <Label htmlFor="synopsis">Description / Synopsis</Label>
              <Textarea
                id="synopsis"
                name="synopsis"
                required
                rows={4}
                className="bg-night-card border-night-border mt-1"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (Comma separated)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="action, romance, mature"
                className="bg-night-card border-night-border mt-1"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Video Platform</Label>
              <Select name="videoPlatform" defaultValue="doodstream">
                <SelectTrigger className="bg-night-card border-night-border mt-1">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent className="bg-night-card border-night-border text-white">
                  <SelectItem value="doodstream">Doodstream</SelectItem>
                  <SelectItem value="player4me">Player4Me</SelectItem>
                  <SelectItem value="filemoon">Filemoon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="videoId">Video ID / File Code</Label>
              <Input
                id="videoId"
                name="videoId"
                required
                className="bg-night-card border-night-border mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="0"
                  className="bg-night-card border-night-border mt-1"
                />
              </div>
              <div>
                <Label htmlFor="releaseDate">Release Date</Label>
                <Input
                  id="releaseDate"
                  name="releaseDate"
                  type="date"
                  required
                  className="bg-night-card border-night-border mt-1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch id="isFeatured" name="isFeatured" />
              <Label htmlFor="isFeatured">
                Featured Video (Show in Hero/Carousel)
              </Label>
            </div>

            <div className="pt-4">
              <Label>Categories</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto p-4 bg-night-card border border-night-border rounded-md">
                {categories.map((cat: any) => (
                  <div key={cat.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${cat.id}`}
                      name="categoryIds"
                      value={cat.id}
                    />
                    <Label
                      htmlFor={`cat-${cat.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {cat.name}
                    </Label>
                  </div>
                ))}
                {categories.length === 0 && (
                  <span className="text-night-muted text-sm">
                    No categories found. Create some first.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || isModerating}
          className="w-full sm:w-auto bg-night-accent hover:bg-night-accent/90 text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isModerating ? "Checking AI Moderation..." : isSubmitting ? "Uploading & Saving..." : "Publish Video"}
        </Button>
      </Form>
    </div>
  );
}
