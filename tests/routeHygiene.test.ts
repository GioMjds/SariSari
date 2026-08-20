import fs from 'node:fs';
import path from 'node:path';

function findTestModules(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return findTestModules(absolutePath);
    }

    return /(?:^|\.)test\.[cm]?[jt]sx?$/.test(entry.name)
      ? [path.relative(process.cwd(), absolutePath).replaceAll('\\', '/')]
      : [];
  });
}

describe('Expo Router route hygiene', () => {
  it('keeps Jest test modules outside the app route tree', () => {
    expect(findTestModules(path.join(process.cwd(), 'app'))).toEqual([]);
  });
});
