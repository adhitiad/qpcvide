import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.resolve(process.cwd(), 'data.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const items = JSON.parse(rawData);

  console.log(`Found ${items.length} items in data.json`);

  // Pastikan kategori default ada
  const categoryName = 'General';
  let category = await prisma.category.findUnique({
    where: { name: categoryName }
  });

  if (!category) {
    category = await prisma.category.create({
      data: { name: categoryName, slug: categoryName.toLowerCase(), type: 'genre' }
    });
    console.log(`Created new category: ${categoryName}`);
  }

  // Pastikan tag default ada
  const tagName = 'viral';
  let tag = await prisma.tag.findUnique({
    where: { name: tagName }
  });

  if (!tag) {
    tag = await prisma.tag.create({
      data: { name: tagName }
    });
    console.log(`Created new tag: ${tagName}`);
  }

  let importedCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    if (!item.id || !item.title) continue;

    const existingVideo = await prisma.video.findFirst({
      where: {
        OR: [
          { videoId: item.id },
          { title: item.title.replace('.mp4', '').trim() }
        ]
      }
    });

    if (existingVideo) {
      skippedCount++;
      continue;
    }

    const cleanTitle = item.title.replace(/\.mp4$/i, '').trim();
    // Buat slug yang unik
    const baseSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${item.id}`;

    try {
      await prisma.video.create({
        data: {
          title: cleanTitle,
          slug,
          synopsis: cleanTitle,
          thumbnail: item.poster || '',
          videoPlatform: 'player4me',
          videoId: item.id,
          releaseDate: new Date(),
          categories: {
            create: [
              {
                category: {
                  connect: { id: category.id }
                }
              }
            ]
          },
          tags: {
            create: [
              {
                tag: {
                  connect: { id: tag.id }
                }
              }
            ]
          }
        }
      });
      importedCount++;
      console.log(`Imported: ${cleanTitle} (${item.id})`);
    } catch (error) {
      console.error(`Failed to import ${item.id}:`, error);
    }
  }

  console.log(`\nImport complete!`);
  console.log(`Successfully imported: ${importedCount}`);
  console.log(`Skipped (already exists): ${skippedCount}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
