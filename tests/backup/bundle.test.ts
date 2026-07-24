import { createBackupBundle, extractBackupBundle } from '../../lib/backup/bundle';

describe('ZIP Backup Bundle Packaging', () => {
  test('creates a valid zip bundle containing manifest.json, database, and receipt files', async () => {
    const dbBuffer = Buffer.from('SQLITE-HEADER-MOCK-DB-CONTENT');
    const receiptFiles = [
      { relativePath: 'receipts/rcpt1.jpg', content: Buffer.from('IMAGE-DATA-1') },
    ];

    const zipBuffer = await createBackupBundle(dbBuffer, receiptFiles);
    expect(zipBuffer).toBeInstanceOf(Uint8Array);

    const extracted = await extractBackupBundle(zipBuffer);
    expect(extracted.manifest.version).toBe(1);
    expect(Buffer.from(extracted.dbBuffer).toString()).toBe('SQLITE-HEADER-MOCK-DB-CONTENT');
    expect(extracted.receipts).toHaveLength(1);
    expect(extracted.receipts[0].relativePath).toBe('receipts/rcpt1.jpg');
    expect(Buffer.from(extracted.receipts[0].content).toString()).toBe('IMAGE-DATA-1');
  });
});
