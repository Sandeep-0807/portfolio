import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = process.cwd();
const inputPath = process.argv[2] ? path.resolve(root, process.argv[2]) : path.resolve(root, "public", "favicon.png");
const outputPath = path.resolve(root, "public", "favicon.ico");

if (!fs.existsSync(inputPath)) {
  console.error(`Missing input image: ${inputPath}`);
  console.error("Place your icon at public/favicon.png (recommended) or pass a path argument.");
  process.exit(1);
}

async function main() {
  const sizes = [16, 32, 48, 64, 128, 256];
  const buffers = await Promise.all(
    sizes.map((size) => sharp(inputPath).resize(size, size, { fit: "contain" }).png().toBuffer()),
  );

  const ico = await pngToIco(buffers);
  fs.writeFileSync(outputPath, ico);

  console.log(`Wrote ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
