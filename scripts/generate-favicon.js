/**
 * Generates favicon sizes from images/GO Logo Black.png
 * Run: node scripts/generate-favicon.js
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const root = path.join(__dirname, "..");
const src = path.join(root, "images", "GO Logo Black.png");
const outDir = path.join(root, "app");

const sizes = [
  { name: "icon.png", size: 32 },
  { name: "icon-16.png", size: 16 },
  { name: "icon-32.png", size: 32 },
  { name: "icon-48.png", size: 48 },
  { name: "apple-icon.png", size: 180 },
];

async function generate() {
  if (!fs.existsSync(src)) {
    console.error("Source image not found:", src);
    process.exit(1);
  }
  const resizeOpts = { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } };

  for (const { name, size } of sizes) {
    await sharp(src)
      .resize(size, size, resizeOpts)
      .png()
      .toFile(path.join(outDir, name));
    console.log(`Created app/${name} (${size}x${size})`);
  }

  console.log("Favicon generation done.");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
