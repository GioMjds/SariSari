// tests/backup/googleDrive.test.ts
// Spec §4.5 — bare-fetch wrapper handles 401/429/5xx correctly.
//
// We mock global.fetch and the SecureStore singleton. Tests are
// layered: each describe focuses on one HTTP code path.

import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { authedFetch, ensureFreshToken, SS_KEY_ACCESS } from '@/lib/backup/googleDrive';

// global.fetch isn't a Jest mock by default — replace it with one we
// control. Each test sets the desired response via `mockResolvedValueOnce`.
const mockFetch = jest.fn();
(global as unknown as { fetch: jest.Mock }).fetch = mockFetch;

const jsonResponse = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(extraHeaders),
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as Response;

/** Configure the constants mock so `getClientId()` returns a non-null id. */
const seedClientId = (id: string | null = 'fake-client-id') => {
  (Constants as unknown as { expoConfig: { extra: { googleClientId: string } } }).expoConfig = {
    extra: { googleClientId: id ?? '' },
  };
};

describe('lib/backup/googleDrive.authedFetch — Phase 2', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await SecureStore.deleteItemAsync(SS_KEY_ACCESS);
    await SecureStore.deleteItemAsync('gdrive_refresh');
    seedClientId();
    // Seed a non-expired token AND a refresh token so `ensureFreshToken`
    // returns the cached access token without trying to refresh — that
    // way tests of `authedFetch` only exercise the fetch path.
    await SecureStore.setItemAsync(
      SS_KEY_ACCESS,
      JSON.stringify({
        accessToken: 'fresh-token',
        expiresAt: Date.now() + 60 * 60 * 1000,
      }),
    );
    await SecureStore.setItemAsync('gdrive_refresh', 'refresh-token-abc');
  });

  it('attaches the bearer token', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: 1 }));
    await authedFetch('https://example.com/test');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/test',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const headers = mockFetch.mock.calls[0][1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer fresh-token');
  });

  it('throws gdrive_network on fetch rejection', async () => {
    mockFetch.mockRejectedValueOnce(new Error('offline'));
    await expect(authedFetch('https://x/y')).rejects.toMatchObject({
      kind: 'gdrive_network',
    });
  });

  it('throws gdrive_quota with retry-after header parsed', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({}, 429, { 'Retry-After': '120' }),
    );
    await expect(authedFetch('https://x/y')).rejects.toMatchObject({
      kind: 'gdrive_quota',
      status: 429,
      retryAfterSec: 120,
    });
  });

  it('throws gdrive_quota with default retry-after when missing', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 429));
    await expect(authedFetch('https://x/y')).rejects.toMatchObject({
      kind: 'gdrive_quota',
      retryAfterSec: 60,
    });
  });

  it('throws gdrive_server on 5xx', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse('boom', 503));
    await expect(authedFetch('https://x/y')).rejects.toMatchObject({
      kind: 'gdrive_server',
      status: 503,
    });
  });

  it('returns the response on 200', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ hello: 'world' }));
    const r = await authedFetch('https://x/y');
    expect((r as Response).status).toBe(200);
  });
});

describe('lib/backup/googleDrive.ensureFreshToken — Phase 2', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await SecureStore.deleteItemAsync(SS_KEY_ACCESS);
    await SecureStore.deleteItemAsync('gdrive_refresh');
    seedClientId();
  });

  it('returns the existing token when not expired', async () => {
    await SecureStore.setItemAsync(
      SS_KEY_ACCESS,
      JSON.stringify({
        accessToken: 'still-fresh',
        expiresAt: Date.now() + 10 * 60 * 1000,
      }),
    );
    const t = await ensureFreshToken();
    expect(t).toBe('still-fresh');
  });

  it('throws gdrive_auth when no refresh token is stored', async () => {
    await SecureStore.setItemAsync(
      SS_KEY_ACCESS,
      JSON.stringify({
        accessToken: 'expired',
        expiresAt: 0,
      }),
    );
    await expect(ensureFreshToken()).rejects.toMatchObject({
      kind: 'gdrive_auth',
    });
  });
});
