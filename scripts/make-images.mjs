// Generates every derived image from public/img/island.jpg. Run with `npm run images`
// after changing the photo or a crop below; the outputs are committed.
//
// public/img/bg-*.{avif,webp,jpg}            full background, 3 widths
// public/img/header-sky-*.{avif,webp,jpg}    panel header strip on tablet/desktop (sky only)
// public/img/header-island-*.{avif,webp,jpg} panel header strip on phones (island + sky)
// tests/fixtures/media/low-tide-disco.jpg     cover for one demo mix (tests only)
// public/icons/*                             round avatar crop: favicons, PWA icons, artwork

import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'public', 'img', 'island.jpg');
const imgDir = join(root, 'public', 'img');
const iconDir = join(root, 'public', 'icons');

// Crops in source pixels (the photo is 1920 x 1279).
/** Round avatar: centred on the palm island. */
const AVATAR = { cx: 880, cy: 585, r: 310 };
/** Header strips. */
const HEADER_SKY = { left: 0, top: 0, width: 1920, height: 440 };
const HEADER_ISLAND = { left: 420, top: 220, width: 920, height: 511 };
/** Demo cover for the tests: shallow water and waves. */
const COVER = { left: 1180, top: 679, width: 600, height: 600 };

const BG_WIDTHS = [960, 1440, 1920];
const HEADER_SKY_WIDTHS = [960, 1920];
const HEADER_ISLAND_WIDTHS = [600, 720, 920];
const ARTWORK_SIZES = [96, 192, 256, 384, 512];

mkdirSync(iconDir, { recursive: true });

async function writeVariants(region, widths, name) {
  for (const width of widths) {
    const base = () => {
      const image = sharp(source);
      if (region) image.extract(region);
      return image.resize({ width, withoutEnlargement: true });
    };
    const out = join(imgDir, `${name}-${width}`);
    await base().avif({ quality: 50, effort: 6, chromaSubsampling: '4:2:0' }).toFile(`${out}.avif`);
    await base().webp({ quality: 74, effort: 6 }).toFile(`${out}.webp`);
    await base().jpeg({ quality: 76, mozjpeg: true, progressive: true }).toFile(`${out}.jpg`);
  }
}

const avatarSquare = {
  left: AVATAR.cx - AVATAR.r,
  top: AVATAR.cy - AVATAR.r,
  width: AVATAR.r * 2,
  height: AVATAR.r * 2,
};

/** 1024px master of the round crop with a transparent outside, smooth edge. */
async function roundMaster() {
  const size = 1024;
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="#fff"/></svg>`,
  );
  return sharp(source)
    .extract(avatarSquare)
    .resize(size, size)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function writeIcons() {
  const master = await roundMaster();
  const round = (size, file) =>
    sharp(master)
      .resize(size, size)
      .png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 })
      .toFile(join(iconDir, file));

  await round(16, 'favicon-16.png');
  await round(32, 'favicon-32.png');
  await round(192, 'icon-192.png');
  await round(512, 'icon-512.png');
  for (const size of ARTWORK_SIZES) await round(size, `artwork-${size}.png`);

  // Phones mask these icons themselves (circle or rounded square), so they are full-bleed
  // and opaque. Maskable icons keep the island inside the inner 80% safe zone.
  const safe = Math.round(AVATAR.r / 0.8);
  await sharp(source)
    .extract({ left: AVATAR.cx - safe, top: AVATAR.cy - safe, width: safe * 2, height: safe * 2 })
    .resize(512, 512)
    .png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 })
    .toFile(join(iconDir, 'maskable-512.png'));
  await sharp(source)
    .extract(avatarSquare)
    .resize(180, 180)
    .png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 })
    .toFile(join(iconDir, 'apple-touch-icon.png'));
}

await writeVariants(null, BG_WIDTHS, 'bg');
await writeVariants(HEADER_SKY, HEADER_SKY_WIDTHS, 'header-sky');
await writeVariants(HEADER_ISLAND, HEADER_ISLAND_WIDTHS, 'header-island');
await sharp(source)
  .extract(COVER)
  .resize(360, 360)
  .jpeg({ quality: 78, mozjpeg: true })
  .toFile(join(root, 'tests', 'fixtures', 'media', 'low-tide-disco.jpg'));
await writeIcons();

console.log('Images written to public/img and public/icons.');
