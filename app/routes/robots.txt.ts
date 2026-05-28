import type { Route } from "./+types/robots.txt";

export function loader({ request }: Route.LoaderArgs) {
  const baseUrl = new URL(request.url).origin;

  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robots, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
