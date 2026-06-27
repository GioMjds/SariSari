// lib/backup/googleDrive.ts
// Google Drive `appDataFolder` client. Bare `fetch` + PKCE OAuth.
//
// Spec §4.1 (Authentication) + §4.5 (Drive API calls). This module is
// the only consumer of `expo-auth-session` and `expo-secure-store`
// in the backup pipeline — everything else reads through this surface.
//
// Why no SDK? The Drive SDK is ~250 KB and pulls in `google-auth-library`
// which is hostile to React Native (uses Node `crypto` and `fs`). Bare
// `fetch` covers the six operations we need:
//
//   findFile, create, update, download, delete, getMetadataSidecar
//
// Authentication uses PKCE (no client secret). The access token lives in
// SecureStore; the refresh token does too. `ensureFreshToken()` is the
// only entry point that touches tokens.
//
// See `docs/superpowers/specs/2026-06-27-data-backup-restore-design.md`
// §4 for the full Drive design.

import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { parseMetadata } from './metadata';
import type { Metadata, BackupError } from './types';

type AuthRequest = AuthSession.AuthRequest;

// `expo-web-browser` registers a deep-link handler when this resolves.
// Top-level side effect: required for the OAuth redirect to close the
// in-app browser on iOS. See expo-auth-session docs.
WebBrowser.maybeCompleteAuthSession();

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Drive scope requested at OAuth time. `appDataFolder` is hidden from
 * the user's Drive UI; only this app can read/write files in it.
 */
export const GDRIVE_SCOPE =
  'https://www.googleapis.com/auth/drive.appdata';

/** Fixed filename for the DB inside Drive's appDataFolder. */
export const DRIVE_DB_FILENAME = 'sarisari_backup.db';
/** Fixed filename for the metadata sidecar. */
export const DRIVE_META_FILENAME = 'backup_metadata.json';

/** SecureStore keys. */
export const SS_KEY_ACCESS = 'gdrive_access';
export const SS_KEY_REFRESH = 'gdrive_refresh';

/** Buffer in seconds subtracted from `expiresAt` to refresh early. */
const TOKEN_EXPIRY_SAFETY_SEC = 60;

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

/** Persisted access token shape. `expiresAt` is epoch ms. */
export type AccessToken = {
  accessToken: string;
  expiresAt: number;
};

/** Parsed Drive file metadata for the picker. */
export type DriveFileMeta = {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
};

/** Options for `exchangeCodeForTokens()`. */
export type AuthFlowOptions = {
  /** Result of `AuthRequest.promptAsync()` from the hook. */
  authResult: AuthSession.AuthSessionResult;
  /** The same `AuthRequest` instance whose `.codeVerifier` is needed. */
  request: AuthRequest;
};

/* -------------------------------------------------------------------------- */
/*  Token storage                                                             */
/* -------------------------------------------------------------------------- */

/** Read the persisted access token, or `null` if missing/corrupt. */
export const readAccessToken = async (): Promise<AccessToken | null> => {
  const raw = await SecureStore.getItemAsync(SS_KEY_ACCESS);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AccessToken;
  } catch {
    return null;
  }
};

/** Persist the access token. Called after a successful code exchange. */
export const writeAccessToken = async (token: AccessToken): Promise<void> => {
  await SecureStore.setItemAsync(SS_KEY_ACCESS, JSON.stringify(token));
};

/** Persist the refresh token. */
export const writeRefreshToken = async (refreshToken: string): Promise<void> => {
  await SecureStore.setItemAsync(SS_KEY_REFRESH, refreshToken);
};

/** Wipe both tokens. Called by `unlinkDrive()`. */
export const clearTokens = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(SS_KEY_ACCESS);
  await SecureStore.deleteItemAsync(SS_KEY_REFRESH);
};

/* -------------------------------------------------------------------------- */
/*  Client config                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Read the OAuth client id from app config. Returns `null` when empty
 * (Phase 1 "not configured" state). The UI shows the disabled Link
 * button so the user knows Drive is intentionally unavailable.
 */
export const getClientId = (): string | null => {
  const id = Constants.expoConfig?.extra?.googleClientId;
  if (typeof id === 'string' && id.trim().length > 0) return id;
  return null;
};

/**
 * Google discovery document for OAuth endpoints. Static — no need to
 * fetch the well-known doc at runtime; the URL set is stable.
 */
export const getDiscovery = (): AuthSession.DiscoveryDocument => ({
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
});

/**
 * Redirect URI used for the OAuth dance. Matches the Expo scheme in
 * `app.json`; `expo-auth-session` derives it from the app config so we
 * don't hard-code `sarisari://`.
 */
export const makeRedirectUri = (): string =>
  AuthSession.makeRedirectUri({ scheme: 'sarisari', path: 'redirect' });

/* -------------------------------------------------------------------------- */
/*  OAuth flow                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Exchange the authorization code returned from `AuthRequest.promptAsync`
 * for access + refresh tokens. Persists both in SecureStore and returns
 * the new access token.
 *
 * `lib/backup/` does not own the React hook (`useAuthRequest` lives in
 * `hooks/useBackup.tsx`), so this takes the result + request from the
 * caller and does only the I/O.
 */
export const exchangeCodeForTokens = async ({
  authResult,
  request,
}: AuthFlowOptions): Promise<AccessToken> => {
  if (authResult.type !== 'success') {
    throw makeAuthError('User cancelled or auth failed.');
  }
  const clientId = getClientId();
  if (!clientId) {
    throw makeNotConfiguredError();
  }
  if (!request.codeVerifier) {
    throw makeAuthError('AuthRequest is missing PKCE verifier.');
  }
  const { code } = authResult.params;
  if (!code) {
    throw makeAuthError('Auth response missing authorization code.');
  }
  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code,
      redirectUri: makeRedirectUri(),
      extraParams: { code_verifier: request.codeVerifier },
    },
    getDiscovery(),
  );
  const accessToken: AccessToken = {
    accessToken: tokenResponse.accessToken,
    expiresAt: Date.now() + (tokenResponse.expiresIn ?? 3600) * 1000,
  };
  await writeAccessToken(accessToken);
  if (tokenResponse.refreshToken) {
    await writeRefreshToken(tokenResponse.refreshToken);
  }
  return accessToken;
};

/* -------------------------------------------------------------------------- */
/*  Token refresh                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Return a non-expired access token, refreshing if needed. Throws
 * `BackupError('gdrive_auth')` if refresh fails — the UI surfaces
 * this as the "re-link" banner.
 */
export const ensureFreshToken = async (): Promise<string> => {
  const clientId = getClientId();
  if (!clientId) {
    throw makeNotConfiguredError();
  }
  const existing = await readAccessToken();
  if (
    existing &&
    existing.expiresAt - Date.now() > TOKEN_EXPIRY_SAFETY_SEC * 1000
  ) {
    return existing.accessToken;
  }
  const refreshToken = await SecureStore.getItemAsync(SS_KEY_REFRESH);
  if (!refreshToken) {
    throw makeAuthError('No refresh token. Please re-link Google Drive.');
  }
  try {
    const tokenResponse = await AuthSession.refreshAsync(
      { clientId, refreshToken },
      getDiscovery(),
    );
    const next: AccessToken = {
      accessToken: tokenResponse.accessToken,
      expiresAt: Date.now() + (tokenResponse.expiresIn ?? 3600) * 1000,
    };
    await writeAccessToken(next);
    if (tokenResponse.refreshToken) {
      await writeRefreshToken(tokenResponse.refreshToken);
    }
    return next.accessToken;
  } catch (err) {
    // Refresh failed → user must re-link. Wipe so we don't loop.
    await clearTokens();
    throw makeAuthError(
      err instanceof Error ? err.message : 'Token refresh failed.',
    );
  }
};

/* -------------------------------------------------------------------------- */
/*  Authed fetch                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Bare fetch wrapper with 401 → one refresh-and-retry, 429 → honor
 * `Retry-After`, 5xx → throw `gdrive_server`. Used by every Drive
 * call below.
 */
export const authedFetch = async (
  url: string,
  init: RequestInit = {},
  retried = false,
): Promise<Response> => {
  const token = await ensureFreshToken();
  const headers = new Headers(init.headers ?? {});
  headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    const error: BackupError = { kind: 'gdrive_network', message };
    throw error;
  }
  if (response.status === 401 && !retried) {
    // One refresh + retry, then surface gdrive_auth if it still 401s.
    await clearTokens();
    return authedFetch(url, init, true);
  }
  if (response.status === 401) {
    throw makeAuthError('Drive session expired. Please re-link.');
  }
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After') ?? '60');
    throw {
      kind: 'gdrive_quota',
      status: 429,
      retryAfterSec: Number.isFinite(retryAfter) ? retryAfter : 60,
    } satisfies BackupError;
  }
  if (response.status >= 500) {
    const body = await safeText(response);
    throw {
      kind: 'gdrive_server',
      status: response.status,
      message: body || response.statusText,
    } satisfies BackupError;
  }
  return response;
};

const safeText = async (r: Response): Promise<string> => {
  try {
    return await r.text();
  } catch {
    return '';
  }
};

/* -------------------------------------------------------------------------- */
/*  Drive operations                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Find a file by name in `appDataFolder`. Returns `null` when Drive
 * has no matching file (first-time sync). The query uses the
 * `trashed=false` filter to avoid racing with a past delete.
 */
export const findFile = async (name: string): Promise<string | null> => {
  const q = `name='${name.replace(/'/g, "\\'")}' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,size)`;
  const r = await authedFetch(url);
  const json = (await r.json()) as { files?: DriveFileMeta[] };
  return json.files?.[0]?.id ?? null;
};

/**
 * Create a new file in `appDataFolder` with the given binary body.
 * Used both for the DB and the metadata sidecar — Drive doesn't
 * care which is which. Returns the new file id.
 */
export const createFile = async (
  name: string,
  data: Blob | ArrayBuffer | string,
  contentType = 'application/octet-stream',
): Promise<string> => {
  const meta = { name, parents: ['appDataFolder'] };
  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(meta)], { type: 'application/json' }),
  );
  form.append('file', data instanceof Blob ? data : new Blob([data]), name);
  const r = await authedFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    { method: 'POST', body: form },
  );
  const json = (await r.json()) as { id?: string };
  if (!json.id) throw new Error('Drive create returned no id');
  return json.id;
};

/**
 * Overwrite an existing file's binary content with media-only PATCH.
 * Used for both the DB and the metadata sidecar.
 */
export const updateFile = async (
  fileId: string,
  data: Blob | ArrayBuffer | string,
  contentType = 'application/octet-stream',
): Promise<void> => {
  await authedFetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': contentType },
      body: data,
    },
  );
};

/**
 * Download a file by id to a local filesystem path. Caller provides
 * the dest path (typically under `FileSystem.cacheDirectory`).
 */
export const downloadFile = async (
  fileId: string,
  destPath: string,
): Promise<void> => {
  const r = await authedFetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
  );
  const text = await r.text();
  const FileSystem = await import('expo-file-system/legacy');
  await FileSystem.writeAsStringAsync(destPath, text, {
    encoding: FileSystem.EncodingType.UTF8,
  });
};

/* -------------------------------------------------------------------------- */
/*  Sidecar helpers (DB + metadata in appDataFolder)                          */
/* -------------------------------------------------------------------------- */

/**
 * Upload (or update) the DB and the metadata sidecar in appDataFolder.
 * If both exist, they're updated; otherwise they're created. The
 * metadata sidecar is small JSON so a separate full-body upload is
 * cheap.
 */
export const uploadBackup = async (
  dbBytes: Blob | ArrayBuffer | string,
  metadata: Metadata,
): Promise<void> => {
  const dbId = await findFile(DRIVE_DB_FILENAME);
  if (dbId) {
    await updateFile(dbId, dbBytes, 'application/octet-stream');
  } else {
    await createFile(DRIVE_DB_FILENAME, dbBytes, 'application/octet-stream');
  }
  const metaId = await findFile(DRIVE_META_FILENAME);
  const metaJson = JSON.stringify(metadata);
  if (metaId) {
    await updateFile(metaId, metaJson, 'application/json');
  } else {
    await createFile(DRIVE_META_FILENAME, metaJson, 'application/json');
  }
};

/**
 * Fetch the metadata sidecar from Drive. Returns `null` when no
 * sidecar exists yet (first-time link) or the body isn't valid JSON.
 */
export const getMetadataSidecar = async (): Promise<Metadata | null> => {
  const id = await findFile(DRIVE_META_FILENAME);
  if (!id) return null;
  const r = await authedFetch(
    `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
  );
  const text = await r.text();
  return parseMetadata(text);
};

/* -------------------------------------------------------------------------- */
/*  Unlink                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Best-effort delete of both Drive files. 404s are swallowed because
 * a stale file we can't find is the same as a deleted file. Other
 * errors are surfaced via the typed BackupError so the UI can decide.
 */
export const deleteBoth = async (): Promise<void> => {
  for (const name of [DRIVE_DB_FILENAME, DRIVE_META_FILENAME]) {
    try {
      const id = await findFile(name);
      if (!id) continue;
      await authedFetch(
        `https://www.googleapis.com/drive/v3/files/${id}`,
        { method: 'DELETE' },
      );
    } catch (err) {
      // Best-effort; log and move on.
      console.warn(`Failed to delete ${name} from Drive:`, err);
    }
  }
  await clearTokens();
};

/* -------------------------------------------------------------------------- */
/*  Error helpers                                                             */
/* -------------------------------------------------------------------------- */

const makeAuthError = (message: string): BackupError => ({
  kind: 'gdrive_auth',
  status: 401,
  message,
});

const makeNotConfiguredError = (): BackupError => ({
  kind: 'gdrive_not_configured',
  message: 'Drive is not configured for this build.',
});
