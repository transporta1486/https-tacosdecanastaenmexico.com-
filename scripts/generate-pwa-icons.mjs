import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const iconsDir = path.join(root, 'icons');

const standardSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#FFFFFF"/>
  <circle cx="256" cy="252" r="150" fill="none" stroke="#06C167" stroke-width="28"/>
  <path d="M132 278 C178 205 334 205 380 278" fill="none" stroke="#06C167" stroke-width="24" stroke-linecap="round"/>
  <path d="M168 272 C210 232 302 232 344 272 L328 300 C288 322 224 322 184 300 Z" fill="#C0392B"/>
  <path d="M196 268 C228 248 284 248 316 268" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity="0.3"/>
</svg>`;

const maskableSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#06C167"/>
  <circle cx="256" cy="252" r="112" fill="none" stroke="#FFFFFF" stroke-width="20"/>
  <path d="M168 268 C198 218 314 218 344 268" fill="none" stroke="#FFFFFF" stroke-width="18" stroke-linecap="round"/>
  <path d="M192 264 C220 238 292 238 320 264 L308 286 C276 302 236 302 204 286 Z" fill="#FFFFFF"/>
</svg>`;

const sizes = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512];

async function renderPng(svg, size, outPath) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

await mkdir(iconsDir, { recursive: true });

for (const size of sizes) {
  const name = size === 180 ? 'icon-180x180.png' : `icon-${size}x${size}.png`;
  await renderPng(standardSvg, size, path.join(iconsDir, name));
  console.log('created', name);
}

await renderPng(maskableSvg, 512, path.join(iconsDir, 'icon-maskable-512x512.png'));
console.log('created icon-maskable-512x512.png');

await renderPng(standardSvg, 192, path.join(root, 'icon-192x192.png'));
await renderPng(standardSvg, 128, path.join(root, 'icon-128x96.png'));
await renderPng(standardSvg, 154, path.join(root, 'icon-154x96.png'));

console.log('Done.');
