import type { Route } from "./+types/admin.analytics";
import { requireAdmin } from "../lib/auth.server";
import { prisma } from "../lib/db.server";
import { useLoaderData } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Eye, MessageSquare, Users, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const meta = () => [{ title: "Analytics - Admin Panel" }];

const COLORS = ["#7C3AED", "#06B6D4", "#E11D48", "#22C55E", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6"];

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Aggregate queries
  const [
    totalViews,
    totalComments7d,
    newUsers7d,
    viewsPerDay,
    commentsPerDay,
    topVideos,
    categoryDistribution,
  ] = await Promise.all([
    // Total views in last 7 days
    prisma.userEvent.count({
      where: { action: "watch", createdAt: { gte: sevenDaysAgo } },
    }),
    // Total comments in last 7 days
    prisma.comment.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    // New users in last 7 days
    prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    // Views per day (last 7 days) - group by date
    prisma.userEvent.findMany({
      where: { action: "watch", createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    // Comments per day (last 7 days)
    prisma.comment.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    // Top 10 videos by views
    prisma.video.findMany({
      take: 10,
      orderBy: { views: "desc" },
      select: { title: true, views: true, _count: { select: { likes: true } } },
    }),
    // Category distribution
    prisma.category.findMany({
      select: {
        name: true,
        _count: { select: { videos: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Group views by day
  const viewsByDay = new Map<string, number>();
  const commentsByDay = new Map<string, number>();

  // Initialize all 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    viewsByDay.set(key, 0);
    commentsByDay.set(key, 0);
  }

  for (const event of viewsPerDay) {
    const key = new Date(event.createdAt).toISOString().split("T")[0];
    if (viewsByDay.has(key)) {
      viewsByDay.set(key, (viewsByDay.get(key) || 0) + 1);
    }
  }

  for (const comment of commentsPerDay) {
    const key = new Date(comment.createdAt).toISOString().split("T")[0];
    if (commentsByDay.has(key)) {
      commentsByDay.set(key, (commentsByDay.get(key) || 0) + 1);
    }
  }

  const viewsChartData = Array.from(viewsByDay.entries()).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString("id-ID", { month: "short", day: "numeric" }),
    views: count,
  }));

  const commentsChartData = Array.from(commentsByDay.entries()).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString("id-ID", { month: "short", day: "numeric" }),
    comments: count,
  }));

  const topVideosChart = topVideos.map((v) => ({
    name: v.title.length > 20 ? v.title.substring(0, 20) + "..." : v.title,
    views: v.views,
    likes: v._count.likes,
  }));

  const categoryChart = categoryDistribution
    .filter((c) => c._count.videos > 0)
    .map((c) => ({
      name: c.name,
      value: c._count.videos,
    }));

  return {
    stats: { totalViews, totalComments7d, newUsers7d },
    viewsChartData,
    commentsChartData,
    topVideosChart,
    categoryChart,
  };
}

export default function AdminAnalytics() {
  const { stats, viewsChartData, commentsChartData, topVideosChart, categoryChart } =
    useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-night-muted">Platform performance — last 7 days.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="bg-night-card border-night-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-night-muted">Views (7d)</CardTitle>
            <Eye className="w-4 h-4 text-night-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString("id-ID")}</div>
          </CardContent>
        </Card>

        <Card className="bg-night-card border-night-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-night-muted">Comments (7d)</CardTitle>
            <MessageSquare className="w-4 h-4 text-night-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalComments7d.toLocaleString("id-ID")}</div>
          </CardContent>
        </Card>

        <Card className="bg-night-card border-night-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-night-muted">New Users (7d)</CardTitle>
            <Users className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.newUsers7d.toLocaleString("id-ID")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Views Per Day */}
        <Card className="bg-night-card border-night-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-night-cyan" />
              Views Per Day
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewsChartData}>
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1A1A2E", borderColor: "#334155", borderRadius: "8px" }}
                />
                <Line type="monotone" dataKey="views" stroke="#06B6D4" strokeWidth={2} dot={{ fill: "#06B6D4" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Comments Per Day */}
        <Card className="bg-night-card border-night-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-night-accent" />
              Comments Per Day
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commentsChartData}>
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1A1A2E", borderColor: "#334155", borderRadius: "8px" }}
                />
                <Line type="monotone" dataKey="comments" stroke="#7C3AED" strokeWidth={2} dot={{ fill: "#7C3AED" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 10 Videos */}
        <Card className="bg-night-card border-night-border">
          <CardHeader>
            <CardTitle>Top 10 Videos</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVideosChart} layout="vertical">
                <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1A1A2E", borderColor: "#334155", borderRadius: "8px" }}
                />
                <Bar dataKey="views" fill="#E11D48" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="bg-night-card border-night-border">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => 
                    name && percent !== undefined ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                  }
                >
                  {categoryChart.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1A1A2E", borderColor: "#334155", borderRadius: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
