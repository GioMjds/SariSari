// lib/backup/metadata.ts
// Build & serialize the cloud-sidecar metadata. Spec §4.3.
//
// The metadata travels alongside the DB file in Google Drive's hidden
// `appDataFolder`. Fetching the JSON is cheap (Drive serves it from the
// file index, no DB download), so the picker and the "cloud newer?"
// comparison are fast even on slow networks.
//
// `buildMetadata()` is intentionally a *pure function* that takes its
// inputs as arguments — `lib/backup/` may not import from `hooks/` or
// `app/`, so the hook layer passes the values in. Profile + sales count
// are read at snapshot time by the caller (see `hooks/useBackup.tsx`).
//
// See `docs/superpowers/specs/2026-06-27-data-backup-restore-design.md`
// §4.3 (Metadata format).

import Constants from 'expo-constants';
import type { Metadata } from './types';

/** Inputs the caller already has on hand at snapshot time. */
export type BuildMetadataInput = {
  /** Store name from the onboarding profile (null if not set yet). */
  storeName: string | null;
  /** Owner name from the onboarding profile (null if not set yet). */
  ownerName: string | null;
  /** Sales count from the TanStack Query cache at snapshot time. */
  salesCount: number;
};

/**
 * Compose a `Metadata` object with the current epoch ms and the app
 * version pulled from `expo-constants`. The version comes from
 * `Constants.expoConfig?.version` — same source the spec calls for
 * (the `appVersion` field is for the store owner's future "what
 * version produced this backup?" reference).
 *
 * `storeName` / `ownerName` are null when the user hasn't completed
 * onboarding; we serialize them as `null` so the JSON shape is
 * stable. The cloud-side picker renders the absence gracefully.
 */
export const buildMetadata = ({
  storeName,
  ownerName,
  salesCount,
}: BuildMetadataInput): Metadata => ({
  updatedAt: Date.now(),
  storeName: storeName ?? '',
  ownerName: ownerName ?? '',
  salesCount,
  appVersion: Constants.expoConfig?.version ?? 'unknown',
});

/**
 * Parse a metadata JSON string from Drive into a typed `Metadata`.
 * Returns `null` if the response isn't valid JSON, has missing fields,
 * or the `updatedAt` isn't a number — every caller treats the absence
 * as "no cloud backup" rather than surfacing a malformed-metadata
 * error, since re-sync will overwrite the bad file.
 */
export const parseMetadata = (json: string | null): Metadata | null => {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.updatedAt !== 'number') return null;
    if (typeof obj.salesCount !== 'number') return null;
    if (typeof obj.appVersion !== 'string') return null;
    return {
      updatedAt: obj.updatedAt,
      storeName: typeof obj.storeName === 'string' ? obj.storeName : '',
      ownerName: typeof obj.ownerName === 'string' ? obj.ownerName : '',
      salesCount: obj.salesCount,
      appVersion: obj.appVersion,
    };
  } catch {
    return null;
  }
};

/**
 * Compare two metadata `updatedAt` epochs. Positive means `a` is newer
 * than `b`; used by the CloudNewerBanner on app start.
 */
export const isNewer = (a: Metadata, b: Metadata | null): boolean => {
  if (!b) return true;
  return a.updatedAt > b.updatedAt;
};
