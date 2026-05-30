import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

async function main() {
  const filePath = path.join(process.cwd(), "data.json");
  const rawData = fs.readFileSync(filePath, "utf-8");
  const videos = JSON.parse(rawData);

  let updated = 0;

  for (const item of videos) {
    const rawTitle = item.title.replace(/\.mp4$/i, "");
    const slug = slugify(rawTitle);
    
    // Extract real video ID from poster URL
    let realVideoId = "";
    if (item.watch && item.watch.includes("#")) {
      realVideoId = item.watch.split("#")[1];
    }

    if (realVideoId) {
      try {
        await prisma.video.update({
          where: { slug },
          data: { videoId: realVideoId }
        });
        console.log(`Updated ${slug} -> videoId: ${realVideoId}`);
        updated++;
      } catch (e: any) {
        console.log(`Failed to update ${slug}: ${e.message}`);
      }
    }
  }

  console.log(`Updated ${updated} videos.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
