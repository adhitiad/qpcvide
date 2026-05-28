import type { Route } from "./+types/admin.revenue";
import { prisma } from "../lib/db.server";
import { requireAdmin } from "../lib/auth.server";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { DollarSign, MousePointerClick, Eye, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "30d";

  const now = new Date();
  let startDate = new Date();
  
  if (period === "7d") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "this_month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "this_year") {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else {
    // 30d default
    startDate.setDate(now.getDate() - 30);
  }

  // Fetch Direct Ads (AdPurchase)
  const purchases = await prisma.adPurchase.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    include: {
      slot: true,
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // Calculate totals
  const totalDirectRevenue = purchases.reduce((sum, p) => sum + (p.slot.price || 0), 0);
  const totalImpressions = purchases.reduce((sum, p) => sum + p.impressions, 0);
  const totalClicks = purchases.reduce((sum, p) => sum + p.clicks, 0);

  // Since AdSense revenue requires API integration (which is complex and out of scope without a service account),
  // Looker Studio handles the holistic view. We'll focus the summary on Direct Ads.

  return {
    lookerUrl: process.env.LOOKER_STUDIO_EMBED_URL || "",
    period,
    directAds: {
      purchases,
      totalRevenue: totalDirectRevenue,
      totalImpressions,
      totalClicks,
    }
  };
}

export default function AdminRevenueDashboard() {
  const { lookerUrl, period, directAds } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handlePeriodChange = (val: string) => {
    searchParams.set("period", val);
    navigate(`?${searchParams.toString()}`);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-serif">Revenue Dashboard</h1>
        <p className="text-night-muted">Comprehensive overview of AdSense and Direct Ads earnings.</p>
      </div>

      {/* Looker Studio Embed */}
      <Card className="bg-night-card border-night-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-night-accent" />
            AdSense & Analytics Overview (Looker Studio)
          </CardTitle>
          <CardDescription className="text-night-muted">
            Holistic metrics directly from your Google Data Studio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lookerUrl ? (
            <div className="w-full h-[600px] rounded-md overflow-hidden border border-night-border bg-[#0D0D1A]">
              <iframe
                src={lookerUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                allowFullScreen
                sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              ></iframe>
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-night-border rounded-md">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-night-muted opacity-50" />
              <p className="text-lg font-medium text-white">Looker Studio Not Configured</p>
              <p className="text-night-muted mb-4">Please set the <code>LOOKER_STUDIO_EMBED_URL</code> environment variable.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Direct Ads Dashboard */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold font-serif">Direct Ads Performance</h2>
          <div className="w-48">
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="bg-night-card border-night-border">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="bg-night-card border-night-border text-white">
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-6">
          <Card className="bg-night-card border-night-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-night-muted">Direct Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${directAds.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-night-card border-night-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-night-muted">Total Impressions</CardTitle>
              <Eye className="w-4 h-4 text-night-cyan" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{directAds.totalImpressions.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-night-card border-night-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-night-muted">Total Clicks</CardTitle>
              <MousePointerClick className="w-4 h-4 text-night-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{directAds.totalClicks.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-night-card border-night-border">
          <CardHeader>
            <CardTitle>Recent Direct Ad Campaigns</CardTitle>
            <CardDescription className="text-night-muted">Tracking for locally managed banners and slots.</CardDescription>
          </CardHeader>
          <CardContent>
            {directAds.purchases.length === 0 ? (
              <div className="text-center py-8 text-night-muted">
                No direct ads found for the selected period.
              </div>
            ) : (
              <div className="rounded-md border border-night-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-night-border hover:bg-transparent">
                      <TableHead>Advertiser</TableHead>
                      <TableHead>Slot</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Impressions</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {directAds.purchases.map((purchase) => (
                      <TableRow key={purchase.id} className="border-night-border hover:bg-night-hover">
                        <TableCell className="font-medium text-white">{purchase.advertiserName}</TableCell>
                        <TableCell className="text-night-muted">{purchase.slot.name}</TableCell>
                        <TableCell className="text-green-400">${purchase.slot.price.toFixed(2)}</TableCell>
                        <TableCell>{purchase.impressions}</TableCell>
                        <TableCell>{purchase.clicks}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              purchase.status === "APPROVED" ? "text-green-500 border-green-500/50" :
                              purchase.status === "PENDING" ? "text-orange-500 border-orange-500/50" :
                              "text-red-500 border-red-500/50"
                            }
                          >
                            {purchase.status}
                          </Badge>
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
    </div>
  );
}
