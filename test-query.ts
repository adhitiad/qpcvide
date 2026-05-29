import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const slug = "flow-host-kacamata-tocil-sange-pengin-nyepong-dream";
  console.log("Checking slug:", slug);

  const videoInclude = {
    tags: { include: { tag: true } },
    categories: { include: { category: true } },
    comments: {
      orderBy: { createdAt: "desc" as const },
      include: { user: { select: { id: true, username: true } } },
    },
    _count: { select: { likes: true } },
  };

  try {
    const video = await prisma.video.findUnique({
      where: { slug },
      include: videoInclude,
    });
    console.log("Video found:", !!video);
  } catch (e: any) {
    console.error("Error finding video:", e.message);
  }
}

main().finally(() => prisma.$disconnect());
