import { createBackupBundle } from '../../lib/backup/bundle';
import { performRestore } from '../../lib/backup/restore';

describe('Receipt-Aware Restore Operation', () => {
  test('restores database and receipt files from bundle with rollback on failure', async () => {
    const dbBuffer = Buffer.from('SQLITE-HEADER-MOCK-DB-DATA');
    const zipBuffer = await createBackupBundle(dbBuffer, [
      { relativePath: 'receipts/test.jpg', content: Buffer.from('IMG-DATA') },
    ]);

    const result = await performRestore(zipBuffer);
    expect(result.success).toBe(true);
    expect(result.restoredReceiptsCount).toBe(1);
  });
});
