import type { Route } from "./+types/api.ip";

export async function loader({ request }: Route.LoaderArgs) {
  // Extract IP from headers
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Get the first IP if multiple
  const clientIp = ip.split(",")[0].trim();

  // Mask the IP: 192.168.1.100 -> 192.168.x.x
  let partialIp = clientIp;
  if (clientIp.includes(".")) {
    // IPv4
    const parts = clientIp.split(".");
    if (parts.length === 4) {
      partialIp = `${parts[0]}.${parts[1]}.x.x`;
    }
  } else if (clientIp.includes(":")) {
    // IPv6
    const parts = clientIp.split(":");
    if (parts.length >= 4) {
      partialIp = `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}:x:x:x:x`;
    }
  }

  return Response.json({ partialIp }, {
    headers: {
      "Cache-Control": "no-store",
    }
  });
}
