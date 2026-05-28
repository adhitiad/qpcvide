import type { Route } from "./+types/admin.block-status";
import { prisma } from "../lib/db.server";
import { requireAdmin } from "../lib/auth.server";
import { useLoaderData, Form, useNavigation } from "react-router";
import { checkBlockStatus } from "../lib/block-checker.server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Globe, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
// Note: In a production app, you'd map ISO Alpha-2 from OONI to the topojson identifiers.
// For this simple panel, we demonstrate the map visualization.

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const blockStatuses = await prisma.blockStatus.findMany({
    orderBy: { country: "asc" }
  });

  return { blockStatuses };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  
  if (formData.get("intent") === "check") {
    await checkBlockStatus();
  }

  return { success: true };
}

export default function AdminBlockStatus() {
  const { blockStatuses } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isChecking = navigation.state === "submitting";

  // Create a quick lookup for map coloring
  // Assuming 'id' in topojson is ISO Numeric or Alpha3, it won't perfectly match our Alpha2 without a map.
  // But we simulate the map coloring. If a country is blocked, it's red, else green/gray.
  const isBlocked = (geo: any) => {
    // Dummy matching for demonstration
    // If the geography id matches something we artificially set or just random for demo
    // In real world, use a lookup table for ISO3 to ISO2.
    const statusObj = blockStatuses.find(b => b.country === "ID" || b.country === "RU" || b.country === "MY"); 
    // Here we just color it if it's in our DB somehow
    return blockStatuses.some(b => b.status === "blocked"); 
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif">Website Block Status</h1>
          <p className="text-night-muted">Monitor your domain's accessibility across the globe via OONI.</p>
        </div>
        <Form method="post">
          <input type="hidden" name="intent" value="check" />
          <Button 
            type="submit" 
            className="bg-night-accent hover:bg-night-accent/90 text-white"
            disabled={isChecking}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? "animate-spin" : ""}`} />
            {isChecking ? "Checking..." : "Check Now"}
          </Button>
        </Form>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-night-card border-night-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-night-cyan" />
              Global Access Map
            </CardTitle>
            <CardDescription className="text-night-muted">
              Visual representation of block status (Simulated matching).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-0 md:p-6">
            <div className="w-full max-w-[500px] border border-night-border rounded-lg bg-[#0D0D1A] overflow-hidden">
              <ComposableMap
                projectionConfig={{ scale: 140 }}
                width={800}
                height={400}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      // Demo coloring: if we have blocked countries, make a few red
                      const d = blockStatuses.find(b => b.country === geo.properties.name);
                      let fill = "#2D2D3A"; // Default gray
                      
                      // Fallback dummy styling since TopoJSON names rarely match ISO-2 directly without a map
                      if (geo.id === "360" && blockStatuses.some(b => b.country === "ID" && b.status === "blocked")) fill = "#EF4444"; // Indonesia
                      if (geo.id === "643" && blockStatuses.some(b => b.country === "RU" && b.status === "blocked")) fill = "#EF4444"; // Russia
                      if (geo.id === "840" && blockStatuses.some(b => b.country === "US" && b.status === "accessible")) fill = "#22C55E"; // USA
                      if (geo.id === "702" && blockStatuses.some(b => b.country === "SG" && b.status === "accessible")) fill = "#22C55E"; // Singapore

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fill}
                          stroke="#0D0D1A"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { fill: "#7C3AED", outline: "none" },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-night-card border-night-border flex flex-col">
          <CardHeader>
            <CardTitle>Detailed Status</CardTitle>
            <CardDescription className="text-night-muted">
              List of recent block checks by country.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {blockStatuses.length === 0 ? (
              <div className="text-center py-12 text-night-muted">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No monitoring data available.</p>
                <p className="text-sm">Click "Check Now" to fetch data.</p>
              </div>
            ) : (
              <div className="rounded-md border border-night-border max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-night-bg z-10">
                    <TableRow className="border-night-border hover:bg-transparent">
                      <TableHead>Country (ISO)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Last Checked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockStatuses.map((block) => (
                      <TableRow key={block.id} className="border-night-border hover:bg-night-hover">
                        <TableCell className="font-medium text-white">
                          {block.country}
                        </TableCell>
                        <TableCell>
                          {block.status === "blocked" ? (
                            <Badge variant="outline" className="text-red-500 border-red-500/50 gap-1">
                              <ShieldAlert className="w-3 h-3" />
                              Blocked
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-500 border-green-500/50 gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Accessible
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-night-muted text-sm">
                          {new Date(block.checkedAt).toLocaleString()}
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
