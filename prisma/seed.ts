import { prisma } from "../app/lib/db.server";

async function main() {
  console.log("Starting seed...");

  // Create Categories (Region, Genre, Format)
  const categoriesData = [
    { name: "JAV", slug: "jav", type: "region", description: "Japanese Adult Video" },
    { name: "Western", slug: "western", type: "region", description: "Western Adult Video" },
    { name: "Asian", slug: "asian", type: "region", description: "Other Asian Adult Video" },
    { name: "European", slug: "european", type: "region", description: "European Adult Video" },
    { name: "Latin", slug: "latin", type: "region", description: "Latin Adult Video" },
    { name: "BDSM", slug: "bdsm", type: "genre", description: "Bondage and Discipline" },
    { name: "Threesome", slug: "threesome", type: "genre", description: "Threesome content" },
    { name: "MILF", slug: "milf", type: "genre", description: "Mature content" },
    { name: "Cosplay", slug: "cosplay", type: "genre", description: "Costume Play" },
    { name: "Lesbian", slug: "lesbian", type: "genre", description: "Girl on Girl" },
    { name: "Hardcore", slug: "hardcore", type: "genre", description: "Hardcore content" },
    { name: "Softcore", slug: "softcore", type: "genre", description: "Softcore content" },
    { name: "Romantic", slug: "romantic", type: "genre", description: "Romantic and passionate" },
    { name: "Full Movie", slug: "full-movie", type: "format", description: "Full length movies" },
    { name: "Clip", slug: "clip", type: "format", description: "Short clips" },
    { name: "Compilation", slug: "compilation", type: "format", description: "Scene compilations" },
    { name: "VR", slug: "vr", type: "format", description: "Virtual Reality" },
  ];

  const categories = await Promise.all(
    categoriesData.map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: cat,
        create: cat,
      })
    )
  );

  // Create Tags
  const tagsData = [
    { name: "HD" },
    { name: "4K" },
    { name: "Exclusive" },
    { name: "Trending" },
    { name: "Uncensored" },
    { name: "Amateur" },
    { name: "Professional" },
  ];

  const tags = await Promise.all(
    tagsData.map((tag) =>
      prisma.tag.upsert({
        where: { name: tag.name },
        update: {},
        create: tag,
      })
    )
  );

  // Dummy Videos
  const dummyVideos = Array.from({ length: 25 }).map((_, i) => ({
    title: `Premium Video ${i + 1}`,
    slug: `premium-video-${i + 1}`,
    synopsis: `This is a short synopsis for Premium Video ${i + 1}.`,
    thumbnail: `https://picsum.photos/seed/video${i + 1}/800/450`, 
    releaseDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
    views: Math.floor(Math.random() * 10000),
    duration: Math.floor(Math.random() * 120) + 10,
    isFeatured: Math.random() > 0.8,
  }));

  for (const videoData of dummyVideos) {
    const video = await prisma.video.upsert({
      where: { slug: videoData.slug },
      update: {},
      create: videoData,
    });

    // Randomly assign 2-3 tags
    const shuffledTags = [...tags].sort(() => 0.5 - Math.random());
    const selectedTags = shuffledTags.slice(0, Math.floor(Math.random() * 2) + 2);

    for (const tag of selectedTags) {
      await prisma.tagOnVideo.upsert({
        where: {
          videoId_tagId: {
            videoId: video.id,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          videoId: video.id,
          tagId: tag.id,
        },
      });
    }

    // Randomly assign 1-3 categories
    const shuffledCats = [...categories].sort(() => 0.5 - Math.random());
    const selectedCats = shuffledCats.slice(0, Math.floor(Math.random() * 3) + 1);

    for (const cat of selectedCats) {
      await prisma.categoryOnVideo.upsert({
        where: {
          videoId_categoryId: {
            videoId: video.id,
            categoryId: cat.id,
          },
        },
        update: {},
        create: {
          videoId: video.id,
          categoryId: cat.id,
        },
      });
    }
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
