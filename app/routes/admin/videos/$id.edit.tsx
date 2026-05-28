import type { Route } from "./+types/$id.edit";
import { Link, Form, useActionData, useNavigation } from "react-router";
import { requireAdmin } from "../../../lib/auth.server";
import { prisma } from "../../../lib/db.server";
import { uploadFileToSupabase } from "../../../lib/storage.server";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Checkbox } from "../../../components/ui/checkbox";
import { Switch } from "../../../components/ui/switch";
import { Label } from "../../../components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAdmin(request);
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const video = await prisma.video.findUnique({
    where: { id: params.id },
    include: {
      tags: { include: { tag: true } },
      categories: true,
    },
  });

  if (!video) {
    throw new Response("Not Found", { status: 404 });
  }

  const selectedCategoryIds = video.categories.map((c) => c.categoryId);
  const tagsString = video.tags.map((t) => t.tag.name).join(", ");

  return { categories, video, selectedCategoryIds, tagsString };
}

export async function action({ request, params }: Route.ActionArgs) {
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

  // Thumbnail upload (Optional on edit)
  const thumbnailFile = formData.get("thumbnail") as File;
  let thumbnailUrl = undefined;

  if (thumbnailFile && thumbnailFile.size > 0) {
    const url = await uploadFileToSupabase(thumbnailFile, "thumbnails");
    if (!url) {
      return { error: "Failed to upload new thumbnail to Supabase." };
    }
    thumbnailUrl = url;
  }

  try {
    // 1. Unlink existing tags/categories to replace them
    await prisma.tagOnVideo.deleteMany({ where: { videoId: params.id } });
    await prisma.categoryOnVideo.deleteMany({ where: { videoId: params.id } });

    // 2. Connect new
    const tagsConnectOrCreate = tagNames.map((name) => ({
      tag: {
        connectOrCreate: {
          where: { name },
          create: { name },
        },
      },
    }));
    const categoriesConnect = categoryIds.map((id) => ({ categoryId: id }));

    // 3. Update video
    const updateData: any = {
      title,
      slug,
      synopsis,
      duration,
      isFeatured,
      videoPlatform,
      videoId,
      releaseDate,
      tags: { create: tagsConnectOrCreate },
      categories: { create: categoriesConnect },
    };

    if (thumbnailUrl) {
      updateData.thumbnail = thumbnailUrl;
    }

    await prisma.video.update({
      where: { id: params.id },
      data: updateData,
    });

    return new Response(null, {
      status: 302,
      headers: { Location: "/admin/videos" },
    });
  } catch (e: any) {
    if (e.code === "P2002") {
      return { error: "A video with this slug already exists." };
    }
    return { error: e.message || "Failed to update video" };
  }
}

export default function AdminVideosEdit({ loaderData }: Route.ComponentProps) {
  const { categories, video, selectedCategoryIds, tagsString } = loaderData;
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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
          Edit Video: {video.title}
        </h1>
      </div>

      {actionData?.error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {actionData.error}
        </div>
      )}

      <Form method="post" encType="multipart/form-data" className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={video.title}
                required
                className="bg-night-card border-night-border mt-1"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={video.slug}
                required
                className="bg-night-card border-night-border mt-1"
              />
            </div>

            <div>
              <Label htmlFor="thumbnail">
                Thumbnail File (Leave empty to keep current)
              </Label>
              <Input
                id="thumbnail"
                name="thumbnail"
                type="file"
                accept="image/*"
                className="bg-night-card border-night-border mt-1 file:text-night-cyan"
              />
              {video.thumbnail && (
                <div className="mt-2">
                  <span className="text-xs text-night-muted block mb-1">
                    Current Thumbnail:
                  </span>
                  <img
                    src={video.thumbnail}
                    alt="Current"
                    className="w-32 h-20 object-cover rounded border border-night-border"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="synopsis">Description / Synopsis</Label>
              <Textarea
                id="synopsis"
                name="synopsis"
                defaultValue={video.synopsis}
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
                defaultValue={tagsString}
                placeholder="action, romance, mature"
                className="bg-night-card border-night-border mt-1"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Video Platform</Label>
              <Select
                name="videoPlatform"
                defaultValue={video.videoPlatform || "doodstream"}
              >
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
                defaultValue={video.videoId || ""}
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
                  defaultValue={video.duration || ""}
                  className="bg-night-card border-night-border mt-1"
                />
              </div>
              <div>
                <Label htmlFor="releaseDate">Release Date</Label>
                <Input
                  id="releaseDate"
                  name="releaseDate"
                  type="date"
                  defaultValue={
                    new Date(video.releaseDate).toISOString().split("T")[0]
                  }
                  required
                  className="bg-night-card border-night-border mt-1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="isFeatured"
                name="isFeatured"
                defaultChecked={video.isFeatured}
              />
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
                      defaultChecked={selectedCategoryIds.includes(cat.id)}
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
          disabled={isSubmitting}
          className="w-full sm:w-auto bg-night-accent hover:bg-night-accent/90 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? "Saving Changes..." : "Save Changes"}
        </Button>
      </Form>
    </div>
  );
}
