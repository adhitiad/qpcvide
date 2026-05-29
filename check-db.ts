import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const videos = await prisma.video.findMany({
    select: { title: true, slug: true }
  });
  console.log("VIDEOS IN DB:");
  videos.forEach(v => console.log(v.slug));
}

main().catch(console.error).finally(() => prisma.$disconnect());
