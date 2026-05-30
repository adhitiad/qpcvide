import type { Route } from "./+types/sitemap.xml";
import { prisma } from "../lib/db.server";
import { supportedLocales } from "../lib/i18n.server";

export async function loader({ request }: Route.LoaderArgs) {
  const videos = await prisma.video.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 1000,
  });

  const categories = await prisma.category.findMany({
    select: {
      name: true,
      createdAt: true,
    },
  });

  const baseUrl = new URL(request.url).origin;

  const getHreflangNodes = (path: string) => {
    return supportedLocales
      .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${baseUrl}/${l}${path}" />`)
      .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${path}" />`)
      .join("\n");
  };

  const urls = videos.map((video) => {
    return `
  <url>
    <loc>${baseUrl}/video/${video.slug}</loc>
    <lastmod>${video.updatedAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
${getHreflangNodes(`/video/${video.slug}`)}
  </url>`;
  });

  const categoryUrls = categories.map((cat) => {
    return `
  <url>
    <loc>${baseUrl}/category/${cat.name.toLowerCase()}</loc>
    <lastmod>${cat.createdAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
${getHreflangNodes(`/category/${cat.name.toLowerCase()}`)}
  </url>`;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
${getHreflangNodes("/")}
  </url>
  <url>
    <loc>${baseUrl}/search</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
${getHreflangNodes("/search")}
  </url>
${urls.join("")}
${categoryUrls.join("")}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "X-Robots-Tag": "noindex, follow",
    },
  });
}
