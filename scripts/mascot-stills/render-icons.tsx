// Renders the app icon set from the vector SariDefault, so icons match the in-app mascot.
// Run: npx tsx --tsconfig scripts/mascot-stills/tsconfig.json scripts/mascot-stills/render-icons.tsx
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { SariDefault } from '../../components/mascot/states/SariDefault';

const CHROME =
  process.env.CHROME_PATH ??
  'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAPER = '#F7F6F2';
// Sari's waving arm and floor shadow pull the drawing left and down; shift by this share of its size to center it.
const OPTICAL_SHIFT = { x: 0.035, y: -0.041 };

interface IconSpec {
  file: string;
  canvas: number;
  sari: number;
  background?: string;
  /** CSS filter, e.g. a white silhouette for Android notifications. */
  filter?: string;
}

const ICONS: IconSpec[] = [
  // iOS and store icon: opaque, the OS rounds the corners.
  { file: 'logo.png', canvas: 1024, sari: 920, background: PAPER },
  // Android adaptive foreground: transparent, Sari kept inside the circular safe zone.
  { file: 'adaptive-icon.png', canvas: 1024, sari: 620 },
  { file: 'splash-icon.png', canvas: 1024, sari: 1024 },
  { file: 'notification-icon.png', canvas: 96, sari: 96, filter: 'brightness(0) invert(1)' },
  { file: 'favicon.png', canvas: 48, sari: 48 },
];

function main() {
  const work = join(tmpdir(), 'sari-icons');
  mkdirSync(work, { recursive: true });

  for (const icon of ICONS) {
    const offset = (icon.canvas - icon.sari) / 2;
    const left = offset + OPTICAL_SHIFT.x * icon.sari;
    const top = offset + OPTICAL_SHIFT.y * icon.sari;
    const body = renderToStaticMarkup(<SariDefault size={icon.sari} animate={false} />);
    const html = `<!doctype html><html><body style="margin:0;background:${icon.background ?? 'transparent'}"><div style="position:relative;width:${icon.canvas}px;height:${icon.canvas}px;overflow:hidden"><div style="position:absolute;left:${left}px;top:${top}px;width:${icon.sari}px;height:${icon.sari}px;filter:${icon.filter ?? 'none'}">${body}</div></div></body></html>`;
    const htmlPath = join(work, `${icon.file}.html`);
    writeFileSync(htmlPath, html);

    execFileSync(CHROME, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--default-background-color=00000000',
      `--window-size=${icon.canvas},${icon.canvas}`,
      `--screenshot=${resolve('assets/images', icon.file)}`,
      pathToFileURL(htmlPath).href,
    ]);
    console.log(`rendered ${icon.file}`);
  }
  rmSync(work, { recursive: true, force: true });
}

main();
