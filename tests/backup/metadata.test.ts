// tests/backup/metadata.test.ts
// Spec §4.3 — metadata format. Pure-function tests; no network.

import { buildMetadata, parseMetadata, isNewer } from '@/lib/backup/metadata';

describe('lib/backup/metadata — Phase 2', () => {
  describe('buildMetadata', () => {
    it('captures updatedAt, store/owner/salesCount, and the app version', () => {
      const m = buildMetadata({
        storeName: "Lina's Sari-Sari Store",
        ownerName: 'Lina Cruz',
        salesCount: 42,
      });
      expect(m.storeName).toBe("Lina's Sari-Sari Store");
      expect(m.ownerName).toBe('Lina Cruz');
      expect(m.salesCount).toBe(42);
      expect(typeof m.updatedAt).toBe('number');
      expect(typeof m.appVersion).toBe('string');
    });

    it('coerces null store/owner to empty string', () => {
      const m = buildMetadata({
        storeName: null,
        ownerName: null,
        salesCount: 0,
      });
      expect(m.storeName).toBe('');
      expect(m.ownerName).toBe('');
    });
  });

  describe('parseMetadata', () => {
    it('round-trips a fresh metadata JSON', () => {
      const m = buildMetadata({
        storeName: 'A',
        ownerName: 'B',
        salesCount: 7,
      });
      const back = parseMetadata(JSON.stringify(m));
      expect(back).toEqual(m);
    });

    it('returns null for empty input', () => {
      expect(parseMetadata(null)).toBeNull();
      expect(parseMetadata('')).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      expect(parseMetadata('{not json')).toBeNull();
    });

    it('returns null when required fields are missing', () => {
      // Missing salesCount
      expect(parseMetadata(JSON.stringify({ updatedAt: 1 }))).toBeNull();
      // Missing appVersion
      expect(
        parseMetadata(
          JSON.stringify({
            updatedAt: 1,
            salesCount: 0,
          }),
        ),
      ).toBeNull();
      // Missing updatedAt
      expect(
        parseMetadata(
          JSON.stringify({
            salesCount: 0,
            appVersion: 'v',
          }),
        ),
      ).toBeNull();
    });

    it('accepts the minimum required fields, coercing strings to empty', () => {
      // storeName / ownerName are optional strings — missing means empty.
      const m = parseMetadata(
        JSON.stringify({
          updatedAt: 1,
          salesCount: 0,
          appVersion: 'v',
        }),
      );
      expect(m).not.toBeNull();
      expect(m?.storeName).toBe('');
      expect(m?.ownerName).toBe('');
    });

    it('coerces missing string fields to empty', () => {
      const m = parseMetadata(
        JSON.stringify({
          updatedAt: 100,
          storeName: null,
          ownerName: undefined,
          salesCount: 5,
          appVersion: '1.0.0',
        }),
      );
      expect(m).not.toBeNull();
      expect(m?.storeName).toBe('');
      expect(m?.ownerName).toBe('');
    });
  });

  describe('isNewer', () => {
    const base = buildMetadata({
      storeName: 'a',
      ownerName: 'b',
      salesCount: 1,
    });
    it('returns true when `b` is null', () => {
      expect(isNewer(base, null)).toBe(true);
    });
    it('returns true when `a` is newer', () => {
      const older = { ...base, updatedAt: base.updatedAt - 1000 };
      expect(isNewer(base, older)).toBe(true);
    });
    it('returns false when `a` is older', () => {
      const older = { ...base, updatedAt: base.updatedAt - 1000 };
      expect(isNewer(older, base)).toBe(false);
    });
  });
});