import type { Route } from "./+types/admin._index";
import { prisma } from "../lib/db.server";
import { requireAdmin } from "../lib/auth.server";
import { useLoaderData } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Film, Tags, Users, MessageSquare } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const [
    animeCount,
    tagCount,
    userCount,
    commentCount,
    popularAnimes
  ] = await Promise.all([
    prisma.video.count(),
    prisma.tag.count(),
    prisma.user.count(),
    prisma.comment.count(),
    prisma.video.findMany({
      take: 5,
      orderBy: { views: "desc" },
      select: { title: true, views: true, _count: { select: { likes: true } } }
    })
  ]);

  const chartData = popularAnimes.map(a => ({
    name: a.title.length > 15 ? a.title.substring(0, 15) + "..." : a.title,
    views: a.views,
    likes: a._count.likes
  }));

  return { stats: { animeCount, tagCount, userCount, commentCount }, chartData };
}

export default function AdminDashboard() {
  const { stats, chartData } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-night-muted">Overview of your platform.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-night-card border-night-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-night-muted">Total Video</CardTitle>
            <Film className="w-4 h-4 text-night-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.animeCount}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-night-card border-night-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-night-muted">Total Tags</CardTitle>
            <Tags className="w-4 h-4 text-night-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.tagCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-night-card border-night-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-night-muted">Total Users</CardTitle>
            <Users className="w-4 h-4 text-night-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.userCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-night-card border-night-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-night-muted">Total Comments</CardTitle>
            <MessageSquare className="w-4 h-4 text-night-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.commentCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-night-card border-night-border">
        <CardHeader>
          <CardTitle>Top 5 Video by Views</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: '#25254A' }}
                contentStyle={{ backgroundColor: '#1A1A2E', borderColor: '#334155', borderRadius: '8px' }} 
              />
              <Bar dataKey="views" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
