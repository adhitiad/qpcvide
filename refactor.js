import { readFileSync, writeFileSync } from "fs";

import { resolve, join } from "path";
import { readdirSync, statSync } from "fs";

function getAllFiles(dirPath, arrayOfFiles) {
  const files = readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        arrayOfFiles.push(join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles("app", []);

const replaces = [
  { from: /prisma\.anime\b/g, to: "prisma.video" },
  { from: /\banimeId\b/g, to: "videoId" },
  { from: /\banimeIds\b/g, to: "videoIds" },
  { from: /\banime\b/g, to: "video" },
  { from: /\banimes\b/g, to: "videos" },
  { from: /\bAnime\b/g, to: "Video" },
  { from: /\bAnimes\b/g, to: "Videos" },
  { from: /TagOnAnime/g, to: "TagOnVideo" },
  { from: /CategoryOnAnime/g, to: "CategoryOnVideo" },
  { from: /AnimeCard/g, to: "VideoCard" },
  { from: /relatedAnimes/g, to: "relatedVideos" },
  { from: /Anime Hub/g, to: "Auiso" },
  { from: /AnimeHub/g, to: "Auiso" },
  { from: /Anime\sHub/g, to: "Auiso" },
];

for (const file of files) {
  let content = readFileSync(file, "utf8");
  let newContent = content;
  
  for (const { from, to } of replaces) {
    newContent = newContent.replace(from, to);
  }

  if (newContent !== content) {
    writeFileSync(file, newContent, "utf8");
    console.log(`Updated ${file}`);
  }
}
