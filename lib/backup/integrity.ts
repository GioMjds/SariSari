// lib/backup/integrity.ts
// Pre-restore integrity check. Three guards, in order, per spec §6:
//
//   1. Magic header — first 16 bytes base64-encoded must equal the
//      SQLite format-3 sentinel. Catches "this is not a database" before
//      we open a handle.
//   2. `PRAGMA integrity_check` via a SEPARATE read-only handle — the
//      live `db` is in WAL mode and would conflict with a probe. The
//      probe is closed in `finally` so an exception during the check
//      still releases the file handle.
//   3. Size sanity — 1KB ≤ size ≤ 100MB. Guards against zero-byte half-
//      writes (spec §10) and oversized junk files a user might have
//      renamed to .db.
//
// This is the ONE place outside `configs/sqlite.ts` allowed to call
// `SQLite.openDatabaseAsync` — see `tests/sqlite/single-handle.test.ts`
// for the enforcement. The probe handle is read-only and short-lived.

import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { MIN_VALID_BYTES } from './snapshots';
import type { IntegrityResult } from './types';

const MAX_VALID_BYTES = 100 * 1024 * 1024;

// Base64 of "SQLite format 3\0" — 16 bytes (53 51 4c 69 74 65 20 66 6f
// 72 6d 61 74 20 33 00).
const SQLITE_HEADER_B64 = 'U1FMaXRlIGZvcm1hdCAzAA==';

/**
 * Run the three-step integrity check against `filePath`. Returns
 * `{ ok: true }` if the file passes; otherwise `{ ok: false, reason, detail? }`.
 *
 * The probe handle is opened read-only via a separate `openDatabaseAsync`
 * call (NOT the live `db` from `configs/sqlite.ts`). A `finally` block
 * guarantees the probe is closed even if `PRAGMA integrity_check` throws.
 */
export const validate = async (filePath: string): Promise<IntegrityResult> => {
  // 1. Magic header.
  let headerB64: string;
  try {
    headerB64 = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.Base64,
      position: 0,
      length: 16,
    });
  } catch (err) {
    return {
      ok: false,
      reason: 'unreasonable_size',
      detail: `could not read header: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
  if (headerB64 !== SQLITE_HEADER_B64) {
    return { ok: false, reason: 'bad_header' };
  }

  // 3. Size sanity (run before opening a handle so we reject the
  // half-written case cheaply — opening a 0-byte .db still works).
  const info = await FileSystem.getInfoAsync(filePath);
  if (!info.exists) {
    return { ok: false, reason: 'unreasonable_size', detail: 'file missing' };
  }
  const size = (info as { size?: number }).size ?? 0;
  if (size < MIN_VALID_BYTES || size > MAX_VALID_BYTES) {
    return { ok: false, reason: 'unreasonable_size', detail: `size=${size}` };
  }

  // 2. PRAGMA integrity_check on a separate handle. The probe is in
  // WAL-compatible mode by default but the live `db` is the only writer
  // so there's no writer conflict on a snapshot file.
  let probe: SQLite.SQLiteDatabase | null = null;
  try {
    probe = await SQLite.openDatabaseAsync(filePath);
    const rows = await probe.getAllAsync<{ integrity_check: string }>(
      'PRAGMA integrity_check',
    );
    const result = rows.map((r) => r.integrity_check).join(' ');
    if (result !== 'ok') {
      return {
        ok: false,
        reason: 'integrity_check_failed',
        detail: result,
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: 'integrity_check_failed',
      detail: err instanceof Error ? err.message : String(err),
    };
  } finally {
    if (probe) {
      try {
        await probe.closeAsync();
      } catch {
        // Best-effort close; the OS will reclaim the handle on app exit.
      }
    }
  }
};
