import * as fflate from 'fflate';
import { canonicalReceiptPathOrThrow } from '@/lib/receipt-storage';

export interface ManifestFileItem {
  relativePath: string;
  byteSize: number;
}

export interface BackupManifest {
  version: number;
  createdAt: number;
  files: ManifestFileItem[];
}

export interface ReceiptFileItem {
  relativePath: string;
  content: Uint8Array;
}

const assertCanonicalReceiptPath = (relativePath: string): void => {
  canonicalReceiptPathOrThrow(relativePath);
};

export async function createBackupBundle(
  dbBuffer: Uint8Array,
  receipts: ReceiptFileItem[],
): Promise<Uint8Array> {
  const manifest: BackupManifest = {
    version: 1,
    createdAt: Date.now(),
    files: [
      { relativePath: 'sarisari.db', byteSize: dbBuffer.byteLength },
      ...receipts.map((r) => {
        assertCanonicalReceiptPath(r.relativePath);
        return {
          relativePath: r.relativePath,
          byteSize: r.content.byteLength,
        };
      }),
    ],
  };

  const manifestJson = JSON.stringify(manifest, null, 2);
  const zipData: Record<string, Uint8Array> = {
    'manifest.json': fflate.strToU8(manifestJson),
    'sarisari.db': dbBuffer,
  };

  for (const r of receipts) {
    assertCanonicalReceiptPath(r.relativePath);
    zipData[r.relativePath] = r.content;
  }

  return new Promise<Uint8Array>((resolve, reject) => {
    fflate.zip(zipData, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

export async function extractBackupBundle(
  zipBuffer: Uint8Array,
): Promise<{
  manifest: BackupManifest;
  dbBuffer: Uint8Array;
  receipts: ReceiptFileItem[];
}> {
  return new Promise((resolve, reject) => {
    fflate.unzip(zipBuffer, (err, unzipped) => {
      if (err) return reject(new Error('Invalid backup archive'));

      const manifestBytes = unzipped['manifest.json'];
      const dbBytes = unzipped['sarisari.db'];

      if (!manifestBytes || !dbBytes) {
        return reject(new Error('Archive missing manifest.json or database file'));
      }

      const manifestText = fflate.strFromU8(manifestBytes);
      const manifest: BackupManifest = JSON.parse(manifestText);

      const receipts: ReceiptFileItem[] = [];
      for (const key of Object.keys(unzipped)) {
        if (key.startsWith('receipts/')) {
          try {
            assertCanonicalReceiptPath(key);
          } catch {
            continue;
          }
          const content = unzipped[key];
          if (!content) continue;
          receipts.push({
            relativePath: key,
            content,
          });
        }
      }

      resolve({ manifest, dbBuffer: dbBytes, receipts });
    });
  });
}
