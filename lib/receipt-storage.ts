import { File, Directory, Paths } from 'expo-file-system';

const RECEIPT_PREFIX = 'receipts/';

const SAFE_BASENAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export const isSafeReceiptBasename = (filename: string): boolean => {
  if (!filename) return false;
  if (filename.includes('/') || filename.includes('\\')) return false;
  if (filename === '.' || filename === '..') return false;
  return SAFE_BASENAME_PATTERN.test(filename);
};

export const buildReceiptRelativePath = (filename: string): string | null => {
  if (!isSafeReceiptBasename(filename)) return null;
  return `${RECEIPT_PREFIX}${filename}`;
};

export const isCanonicalReceiptPath = (relativePath: string): boolean => {
  if (!relativePath || !relativePath.startsWith(RECEIPT_PREFIX)) return false;
  if (relativePath.includes('..')) return false;
  if (relativePath.includes('\\')) return false;
  const rest = relativePath.slice(RECEIPT_PREFIX.length);
  if (rest.includes('/')) return false;
  return isSafeReceiptBasename(rest);
};

export const canonicalReceiptPathOrThrow = (relativePath: string): string => {
  if (!isCanonicalReceiptPath(relativePath)) {
    throw new Error(`Invalid receipt path: ${relativePath}`);
  }
  return relativePath;
};

export async function ensureReceiptDir(): Promise<void> {
  const dir = new Directory(Paths.document, 'receipts');
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
}

export async function saveStagedReceipt(
  sourceUri: string,
  filename: string,
): Promise<string> {
  await ensureReceiptDir();
  const relativePath = buildReceiptRelativePath(filename);
  if (!relativePath) {
    throw new Error(`Invalid receipt filename: ${filename}`);
  }
  const sourceFile = new File(sourceUri);
  const targetFile = new File(Paths.document, relativePath);
  await sourceFile.copy(targetFile);
  return relativePath;
}

export async function removeReceiptFile(relativePath: string): Promise<void> {
  canonicalReceiptPathOrThrow(relativePath);
  const file = new File(Paths.document, relativePath);
  if (file.exists) {
    file.delete();
  }
}
