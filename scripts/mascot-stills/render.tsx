// Renders each Sari state's still pose to a transparent PNG via static markup and headless Chrome.
// Run: npx tsx --tsconfig scripts/mascot-stills/tsconfig.json scripts/mascot-stills/render.tsx
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SARI_STATES } from '../../components/mascot/sariStates';

const SIZE = 512;
const OUT_DIR = resolve('assets/images/sari-stills');
const CHROME =
  process.env.CHROME_PATH ??
  'C:/Program Files/Google/Chrome/Application/chrome.exe';

const pascal = (state: string) =>
  state.replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase());

async function main() {
  const work = join(tmpdir(), 'sari-stills');
  mkdirSync(work, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  for (const state of SARI_STATES) {
    const name = `Sari${pascal(state)}`;
    const mod = (await import(
      `../../components/mascot/states/${name}`
    )) as Record<string, ComponentType<{ size: number; animate: boolean }>>;
    const Component = mod[name];
    if (!Component) throw new Error(`Missing export ${name}`);

    const body = renderToStaticMarkup(
      <Component size={SIZE} animate={false} />,
    );
    const html = `<!doctype html><html><body style="margin:0;background:transparent"><div style="position:relative;width:${SIZE}px;height:${SIZE}px;overflow:hidden">${body}</div></body></html>`;
    const htmlPath = join(work, `${state}.html`);
    writeFileSync(htmlPath, html);

    const pngPath = join(OUT_DIR, `${state}.png`);
    execFileSync(CHROME, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--default-background-color=00000000',
      `--window-size=${SIZE},${SIZE}`,
      `--screenshot=${pngPath}`,
      pathToFileURL(htmlPath).href,
    ]);
    console.log(`rendered ${state}`);
  }
  rmSync(work, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
