/**
 * Converts isotipo-autismo-cordoba.jpg to PNG with transparent background.
 * Removes near-black pixels (the solid background of the original JPG).
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";

const input = "public/brand/isotipo-autismo-cordoba.jpg";
const output = "public/brand/isotipo-autismo-cordoba.png";

const image = sharp(input);
const { width, height } = await image.metadata();

// Get raw RGBA pixel data
const { data } = await image
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// Threshold: pixels darker than this value (0–255) in all channels → transparent
const DARK_THRESHOLD = 30;

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r < DARK_THRESHOLD && g < DARK_THRESHOLD && b < DARK_THRESHOLD) {
    data[i + 3] = 0; // fully transparent
  }
}

await sharp(Buffer.from(data), { raw: { width, height, channels: 4 } })
  .png()
  .toFile(output);

console.log(`✓ Saved ${output} (${width}×${height})`);
