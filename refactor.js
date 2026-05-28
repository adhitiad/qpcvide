const fs = require('fs');
const path = require('path');

const dir = 'app/routes';
const dest = 'app/routes/($lang)';

if (!fs.existsSync(dest)) fs.mkdirSync(dest);

const files = fs.readdirSync(dir);
for (const file of files) {
  if (file === '($lang)') continue;
  if (file.startsWith('api.')) continue;
  if (file.startsWith('sitemap.')) continue;
  if (file.startsWith('robots.')) continue;
  
  const oldPath = path.join(dir, file);
  const newPath = path.join(dest, file);
  
  console.log(`Moving ${oldPath} -> ${newPath}`);
  fs.renameSync(oldPath, newPath);
}
console.log("Done");
