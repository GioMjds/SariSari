// tests/backup/scheduler.test.ts
// Spec §3.6 (triggers) + §4.4 (cloud upload flow).
//
// We mock the network module, SecureStore (link state), the snapshot
// module (to avoid touching the live DB), and the googleDrive module
// (so we can assert on `performCloudUpload` without real HTTP).

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import * as SecureStore from 'expo-secure-store';

const mockCreateLocalSnapshot = jest.fn();
const mockGetMetadataSidecar = jest.fn();
const mockMarkPending = jest.fn();
const mockMarkIdle = jest.fn();

// We don't mock `isDriveLinked` here — it's defined IN scheduler.ts and
// reads `readAccessToken` from googleDrive. Instead we stub SecureStore
// (already mocked in jest.setup.ts) and seed tokens there to flip the
// link state.

jest.mock('@/lib/backup/snapshots', () => {
  const actual = jest.requireActual('@/lib/backup/snapshots');
  return {
    ...actual,
    createLocalSnapshot: (...args: unknown[]) => mockCreateLocalSnapshot(...args),
    DB_PATH: '/tmp/test/SQLite/sarisari.db',
    ensureBackupDirs: jest.fn(async () => undefined),
    AS_KEY_LAST_BACKUP_AT: 'last_backup_at',
  };
});

jest.mock('@/lib/backup/googleDrive', () => {
  const actual = jest.requireActual('@/lib/backup/googleDrive');
  return {
    ...actual,
    getMetadataSidecar: (...args: unknown[]) => mockGetMetadataSidecar(...args),
    SS_KEY_ACCESS: 'gdrive_access',
    SS_KEY_REFRESH: 'gdrive_refresh',
    GDRIVE_SCOPE: 'https://www.googleapis.com/auth/drive.appdata',
    // Override getClientId to return null by default — no client ID is
    // configured under jest. Individual tests can override via
    // jest.requireMock('@/lib/backup/googleDrive').getClientId.
    getClientId: jest.fn(() => null),
  };
});

jest.mock('@/lib/backup/syncQueue', () => ({
  isPending: jest.fn(async () => false),
  markPending: (...args: unknown[]) => mockMarkPending(...args),
  markIdle: (...args: unknown[]) => mockMarkIdle(...args),
}));

import {
  consumeQueue,
  getCloudNewerStatus,
  onSalesMilestone,
  performCloudUpload,
  runStartupChecks,
  shouldAttemptCloudUpload,
  unlinkDrive,
} from '@/lib/backup/scheduler';

const NETWORK = Network as unknown as {
  getNetworkStateAsync: jest.Mock;
  NetworkStateType: { WIFI: string; CELLULAR: string; NONE: string };
};

const baseInputs = { storeName: 'A', ownerName: 'B', salesCount: 5 };

/** Seed a non-expired access token so `isDriveLinked()` returns true. */
const seedLinked = async () => {
  await SecureStore.setItemAsync(
    'gdrive_access',
    JSON.stringify({ accessToken: 'tok', expiresAt: Date.now() + 60 * 60 * 1000 }),
  );
};

describe('lib/backup/scheduler — Phase 2', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    await SecureStore.deleteItemAsync('gdrive_access');
    await SecureStore.deleteItemAsync('gdrive_refresh');
  });

  describe('shouldAttemptCloudUpload', () => {
    it('returns true on Wi-Fi', async () => {
      NETWORK.getNetworkStateAsync.mockResolvedValueOnce({
        isConnected: true,
        isInternetReachable: true,
        type: 'WIFI',
      });
      expect(await shouldAttemptCloudUpload()).toBe(true);
    });

    it('returns false on cellular without opt-in', async () => {
      NETWORK.getNetworkStateAsync.mockResolvedValueOnce({
        isConnected: true,
        isInternetReachable: true,
        type: 'CELLULAR',
      });
      expect(await shouldAttemptCloudUpload()).toBe(false);
    });

    it('returns true on cellular with opt-in', async () => {
      NETWORK.getNetworkStateAsync.mockResolvedValueOnce({
        isConnected: true,
        isInternetReachable: true,
        type: 'CELLULAR',
      });
      await AsyncStorage.setItem('cloud_allow_cellular', 'true');
      expect(await shouldAttemptCloudUpload()).toBe(true);
    });

    it('returns false when disconnected', async () => {
      NETWORK.getNetworkStateAsync.mockResolvedValueOnce({
        isConnected: false,
        isInternetReachable: false,
        type: 'NONE',
      });
      expect(await shouldAttemptCloudUpload()).toBe(false);
    });

    it('returns false when network module throws', async () => {
      NETWORK.getNetworkStateAsync.mockRejectedValueOnce(new Error('boom'));
      expect(await shouldAttemptCloudUpload()).toBe(false);
    });
  });

  describe('runStartupChecks — 24h local trigger', () => {
    it('triggers a local snapshot when no last_backup_at is stored', async () => {
      mockCreateLocalSnapshot.mockResolvedValueOnce({
        ok: true,
        value: { path: '/x.db', bytes: 100, createdAt: Date.now(), kind: 'auto' },
      });
      await runStartupChecks(baseInputs);
      expect(mockCreateLocalSnapshot).toHaveBeenCalled();
    });

    it('does NOT trigger when last_backup_at is fresh', async () => {
      await AsyncStorage.setItem('last_backup_at', String(Date.now() - 60 * 60 * 1000)); // 1h ago
      await runStartupChecks(baseInputs);
      expect(mockCreateLocalSnapshot).not.toHaveBeenCalled();
    });

    it('triggers when last_backup_at is > 24h ago', async () => {
      await AsyncStorage.setItem(
        'last_backup_at',
        String(Date.now() - 25 * 60 * 60 * 1000),
      );
      mockCreateLocalSnapshot.mockResolvedValueOnce({
        ok: true,
        value: { path: '/x.db', bytes: 100, createdAt: Date.now(), kind: 'auto' },
      });
      await runStartupChecks(baseInputs);
      expect(mockCreateLocalSnapshot).toHaveBeenCalled();
    });
  });

  describe('onSalesMilestone', () => {
    it('takes a snapshot and marks the queue pending on success', async () => {
      mockCreateLocalSnapshot.mockResolvedValueOnce({
        ok: true,
        value: { path: '/x.db', bytes: 100, createdAt: Date.now(), kind: 'auto' },
      });
      mockMarkPending.mockResolvedValueOnce(undefined);
      const r = await onSalesMilestone(baseInputs);
      expect(r?.ok).toBe(true);
      expect(mockMarkPending).toHaveBeenCalled();
    });

    it('does not mark pending when the snapshot fails', async () => {
      mockCreateLocalSnapshot.mockResolvedValueOnce({
        ok: false,
        error: { kind: 'unknown', message: 'fs error' },
      });
      const r = await onSalesMilestone(baseInputs);
      expect(r?.ok).toBe(false);
      expect(mockMarkPending).not.toHaveBeenCalled();
    });
  });

  describe('consumeQueue', () => {
    it('marks idle when not linked, even if pending flag is set', async () => {
      const { isPending } = jest.requireMock('@/lib/backup/syncQueue');
      isPending.mockResolvedValueOnce(true);
      // No token in SecureStore → isDriveLinked returns false
      mockMarkIdle.mockResolvedValueOnce(undefined);
      await consumeQueue(baseInputs);
      expect(mockMarkIdle).toHaveBeenCalled();
    });

    it('no-op when not pending', async () => {
      const { isPending } = jest.requireMock('@/lib/backup/syncQueue');
      isPending.mockResolvedValueOnce(false);
      await consumeQueue(baseInputs);
      expect(mockMarkIdle).not.toHaveBeenCalled();
    });
  });

  describe('performCloudUpload', () => {
    it('returns gdrive_not_configured when client id is empty', async () => {
      // Default mock returns null for getClientId
      const r = await performCloudUpload(baseInputs);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.kind).toBe('gdrive_not_configured');
      }
    });

    it('returns gdrive_auth when client id is set but not linked', async () => {
      const { getClientId } = jest.requireMock('@/lib/backup/googleDrive');
      getClientId.mockReturnValueOnce('fake-client-id');
      // No token in SecureStore
      const r = await performCloudUpload(baseInputs);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.kind).toBe('gdrive_auth');
      }
    });
  });

  describe('unlinkDrive', () => {
    it('clears tokens, linked flag, and last-sync timestamp', async () => {
      await SecureStore.setItemAsync('gdrive_access', 'x');
      await AsyncStorage.setItem('cloud_linked', 'true');
      await AsyncStorage.setItem('cloud_last_sync_at', String(Date.now()));
      await unlinkDrive();
      expect(await SecureStore.getItemAsync('gdrive_access')).toBeNull();
      expect(await AsyncStorage.getItem('cloud_linked')).toBeNull();
      expect(await AsyncStorage.getItem('cloud_last_sync_at')).toBeNull();
    });
  });

  describe('getCloudNewerStatus', () => {
    it('returns null when no cloud sidecar exists', async () => {
      mockGetMetadataSidecar.mockResolvedValueOnce(null);
      expect(await getCloudNewerStatus()).toBeNull();
    });

    it('returns the cloud metadata when newer than local', async () => {
      mockGetMetadataSidecar.mockResolvedValueOnce({
        updatedAt: Date.now() + 60_000,
        storeName: 'A',
        ownerName: 'B',
        salesCount: 5,
        appVersion: '1.0',
      });
      await AsyncStorage.setItem(
        'last_backup_at',
        String(Date.now() - 24 * 60 * 60 * 1000),
      );
      const r = await getCloudNewerStatus();
      expect(r).not.toBeNull();
      expect(r?.cloud.salesCount).toBe(5);
    });

    it('returns null when local is newer or equal', async () => {
      mockGetMetadataSidecar.mockResolvedValueOnce({
        updatedAt: Date.now() - 60_000,
        storeName: 'A',
        ownerName: 'B',
        salesCount: 5,
        appVersion: '1.0',
      });
      await AsyncStorage.setItem('last_backup_at', String(Date.now()));
      expect(await getCloudNewerStatus()).toBeNull();
    });
  });
});
