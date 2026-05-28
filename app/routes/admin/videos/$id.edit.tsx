import type { Route } from "./+types/$id.edit";
import { Link, Form, useActionData, useNavigation } from "react-router";
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
import { Badge } from "../../../components/ui/badge";
import { ArrowLeft, Save, Sparkles, Loader2 } from "lucide-react";
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
  const hasAiTagging = !!process.env.GROQ_API_KEY;

  return { categories, video, selectedCategoryIds, tagsString, hasAiTagging };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();

  const title = formData.get("title") as string;
  let slug = formData.get("slug") as string;
  if (!slug) slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const synopsis = formData.get("synopsis") as string;
  const summary = formData.get("summary") as string;
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
  const thumbnailFiles = formData.getAll("thumbnail") as File[];
  let thumbnailUrl = undefined;

  if (thumbnailFiles && thumbnailFiles.length > 0 && thumbnailFiles[0].size > 0) {
    const uploadedUrls = [];
    for (const file of thumbnailFiles) {
      if (file.size > 0) {
        const url = await uploadFileToSupabase(file, "thumbnails");
        if (url) uploadedUrls.push(url);
      }
    }
    
    if (uploadedUrls.length > 0) {
      if (uploadedUrls.length === 1) {
        thumbnailUrl = uploadedUrls[0];
      } else {
        try {
          const apiKey = process.env.GROQ_API_KEY;
          if (apiKey) {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "llama-3.2-90b-vision-preview",
                messages: [{
                  role: "user",
                  content: [
                    { type: "text", text: "Berikan indeks (0 sampai N-1) dari gambar yang paling estetis. HANYA JSON: {\"bestIndex\": 0}" },
                    ...uploadedUrls.map(url => ({ type: "image_url", image_url: { url } }))
                  ]
                }],
                response_format: { type: "json_object" }
              }),
            });
            const json = await response.json();
            const parsed = JSON.parse(json.choices[0].message.content);
            thumbnailUrl = uploadedUrls[parsed.bestIndex || 0];
          } else {
            thumbnailUrl = uploadedUrls[0];
          }
        } catch (e) {
          thumbnailUrl = uploadedUrls[0];
        }
      }
    } else {
      return { error: "Failed to upload new thumbnail to Supabase." };
    }
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
      summary,
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
  const { categories, video, selectedCategoryIds: initialCategoryIds, tagsString, hasAiTagging } = loaderData;
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // AI Tagging State
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [currentTags, setCurrentTags] = useState(tagsString);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set(initialCategoryIds));
  const [titleValue, setTitleValue] = useState(video.title);
  const [synopsisValue, setSynopsisValue] = useState(video.synopsis);
  const [summaryValue, setSummaryValue] = useState((video as any).summary || "");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [hasWatermark, setHasWatermark] = useState(false);

  const handleSuggestTags = async () => {
    if (!titleValue) return alert("Please enter a title first");
    
    setIsSuggesting(true);
    try {
      const res = await fetch("/api/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleValue, description: synopsisValue }),
      });
      
      const data = await res.json();
      if (data.error) {
        alert("AI Error: " + data.error);
      } else {
        setSuggestedTags(data.tags || []);
        setSuggestedCategories(data.categories || []);
      }
    } catch (e) {
      alert("Failed to reach AI service.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAddTag = (tag: string) => {
    if (!currentTags) {
      setCurrentTags(tag);
    } else if (!currentTags.split(",").map(t => t.trim().toLowerCase()).includes(tag.toLowerCase())) {
      setCurrentTags(currentTags + `, ${tag}`);
    }
    setSuggestedTags(suggestedTags.filter(t => t !== tag));
  };

  const handleAddCategory = (catName: string) => {
    // Find matching category (case-insensitive)
    const match = categories.find((c: any) => c.name.toLowerCase() === catName.toLowerCase());
    if (match) {
      const newSet = new Set(selectedCategoryIds);
      newSet.add(match.id);
      setSelectedCategoryIds(newSet);
    } else {
      alert(`Category "${catName}" not found in database. Please create it first.`);
    }
    setSuggestedCategories(suggestedCategories.filter(c => c !== catName));
  };

  const handleCategoryChange = (catId: string, checked: boolean) => {
    const newSet = new Set(selectedCategoryIds);
    if (checked) newSet.add(catId);
    else newSet.delete(catId);
    setSelectedCategoryIds(newSet);
  };

  const handleGenerateSummary = async () => {
    if (!titleValue || !synopsisValue) return alert("Please enter title and synopsis first");
    
    setIsSummarizing(true);
    try {
      const res = await fetch("/api/suggest-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleValue, description: synopsisValue }),
      });
      
      const data = await res.json();
      if (data.error) {
        alert("AI Error: " + data.error);
      } else {
        setSummaryValue(data.summary || "");
      }
    } catch (e) {
      alert("Failed to reach AI service.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (!hasWatermark) {
      e.preventDefault();
      alert("Pastikan Anda sudah menambahkan watermark statis ke video ini.");
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
          Edit Video: {video.title}
        </h1>
      </div>

      {actionData?.error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {actionData.error}
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
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
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
                Thumbnail Files (Upload up to 5 candidates for AI selection, leave empty to keep current)
              </Label>
              <Input
                id="thumbnail"
                name="thumbnail"
                type="file"
                accept="image/*"
                multiple
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
                value={synopsisValue}
                onChange={(e) => setSynopsisValue(e.target.value)}
                required
                rows={4}
                className="bg-night-card border-night-border mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="summary">AI Summary (Optional)</Label>
                {hasAiTagging && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleGenerateSummary}
                    disabled={isSummarizing}
                    className="h-6 px-2 text-night-accent hover:text-white hover:bg-night-accent text-xs"
                  >
                    {isSummarizing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Generate Summary
                  </Button>
                )}
              </div>
              <Textarea
                id="summary"
                name="summary"
                value={summaryValue}
                onChange={(e) => setSummaryValue(e.target.value)}
                rows={2}
                className="bg-night-card border-night-border mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="tags">Tags (Comma separated)</Label>
                {hasAiTagging && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSuggestTags}
                    disabled={isSuggesting}
                    className="h-6 px-2 text-night-accent hover:text-white hover:bg-night-accent text-xs"
                  >
                    {isSuggesting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Suggest Tags
                  </Button>
                )}
              </div>
              <Input
                id="tags"
                name="tags"
                value={currentTags}
                onChange={(e) => setCurrentTags(e.target.value)}
                placeholder="action, romance, mature"
                className="bg-night-card border-night-border mt-1"
              />
              
              {/* AI Tag Suggestions */}
              {suggestedTags.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-night-muted">AI Tag Suggestions (Click to add):</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map(tag => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="cursor-pointer bg-night-hover text-night-cyan hover:bg-night-cyan hover:text-night-bg transition-colors"
                        onClick={() => handleAddTag(tag)}
                      >
                        + {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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
                      checked={selectedCategoryIds.has(cat.id)}
                      onCheckedChange={(checked) => handleCategoryChange(cat.id, checked as boolean)}
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
              
              {/* AI Category Suggestions */}
              {suggestedCategories.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-night-muted">AI Category Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedCategories.map(cat => (
                      <Badge 
                        key={cat} 
                        variant="secondary" 
                        className="cursor-pointer bg-night-hover text-night-accent hover:bg-night-accent hover:text-white transition-colors"
                        onClick={() => handleAddCategory(cat)}
                      >
                        + {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-night-border flex items-center space-x-2">
          <Checkbox 
            id="watermark" 
            checked={hasWatermark}
            onCheckedChange={(c) => setHasWatermark(!!c)} 
          />
          <Label htmlFor="watermark" className="text-red-400 font-bold">
            Saya sudah menambahkan watermark (logo Auiso) secara statis ke video ini
          </Label>
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
