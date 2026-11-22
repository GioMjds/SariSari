// Renders the app icon set from the Sari sprite and the notification icon from the reversed wordmark.
// Each source is cropped to its visible pixels, centered, padded for its target, and downscaled with
// high-quality smoothing, which also softens the sprite's hard cut-out edge.
// Run: node scripts/render-icons.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME =
  process.env.CHROME_PATH ??
  'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAPER = '#F7F6F2';

const dataUri = (path, mime) =>
  `data:${mime};base64,${readFileSync(resolve(path)).toString('base64')}`;
const SPRITE = dataUri('assets/images/sari-emotions/sari-default-state.png', 'image/png');
const WORDMARK = dataUri('assets/images/sarisari-wordmark-reversed-display.svg', 'image/svg+xml');

// fill: share of the canvas the visible pixels may take on their longest side.
const ICONS = [
  // iOS and default icon: opaque, the OS rounds the corners.
  { file: 'logo.png', source: SPRITE, canvas: 1024, fill: 0.8, background: PAPER },
  // Android adaptive foreground: kept inside the circular safe zone (66 of 108 dp).
  { file: 'adaptive-icon.png', source: SPRITE, canvas: 1024, fill: 0.52 },
  { file: 'splash-icon.png', source: SPRITE, canvas: 1024, fill: 0.92 },
  { file: 'favicon.png', source: SPRITE, canvas: 48, fill: 0.92 },
  // Android tints notification icons from alpha only, so the near-white wordmark works as-is.
  { file: 'notification-icon.png', source: WORDMARK, canvas: 96, fill: 0.94 },
];

const page = ({ source, canvas, fill, background }) => `<!doctype html>
<html><body style="margin:0;background:transparent">
<canvas id="c" width="${canvas}" height="${canvas}" style="display:block"></canvas>
<script>
const img = new Image();
img.onload = () => {
  const w = img.naturalWidth, h = img.naturalHeight;
  const probe = document.createElement('canvas');
  probe.width = w; probe.height = h;
  const pctx = probe.getContext('2d');
  pctx.drawImage(img, 0, 0);
  const alpha = pctx.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (alpha[(y * w + x) * 4 + 3] > 8) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const scale = (${fill} * ${canvas}) / Math.max(bw, bh);
  const ctx = document.getElementById('c').getContext('2d');
  ${background ? `ctx.fillStyle = '${background}'; ctx.fillRect(0, 0, ${canvas}, ${canvas});` : ''}
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, x0, y0, bw, bh,
    (${canvas} - bw * scale) / 2, (${canvas} - bh * scale) / 2, bw * scale, bh * scale);
};
img.src = '${source}';
</script></body></html>`;

const work = join(tmpdir(), 'sari-icons');
mkdirSync(work, { recursive: true });
for (const icon of ICONS) {
  const htmlPath = join(work, `${icon.file}.html`);
  writeFileSync(htmlPath, page(icon));
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--default-background-color=00000000',
    '--virtual-time-budget=3000',
    `--window-size=${icon.canvas},${icon.canvas}`,
    `--screenshot=${resolve('assets/images', icon.file)}`,
    pathToFileURL(htmlPath).href,
  ]);
  console.log(`rendered ${icon.file}`);
}
rmSync(work, { recursive: true, force: true });
