import * as FileSystem from 'expo-file-system/legacy';

const RECEIPT_DIR = `${FileSystem.documentDirectory}receipts/`;

export async function ensureReceiptDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(RECEIPT_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(RECEIPT_DIR, { intermediates: true });
  }
}

export async function saveStagedReceipt(
  sourceUri: string,
  filename: string,
): Promise<string> {
  await ensureReceiptDir();
  const relativePath = `receipts/${filename}`;
  const targetUri = `${FileSystem.documentDirectory}${relativePath}`;
  await FileSystem.copyAsync({ from: sourceUri, to: targetUri });
  return relativePath;
}

export async function removeReceiptFile(relativePath: string): Promise<void> {
  const fullPath = `${FileSystem.documentDirectory}${relativePath}`;
  const info = await FileSystem.getInfoAsync(fullPath);
  if (info.exists) {
    await FileSystem.deleteAsync(fullPath, { idempotent: true });
  }
}
