// tests/backup/syncQueue.test.ts
// Spec §4.7 — pending-flag state machine. Three transitions:
// IDLE → QUEUED (markPending), QUEUED → IDLE (markIdle), read via isPending.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isPending, markIdle, markPending } from '@/lib/backup/syncQueue';
import { AS_KEY_CLOUD_SYNC_PENDING } from '@/lib/backup/snapshots';

describe('lib/backup/syncQueue — Phase 2', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('isPending returns false when no flag is set', async () => {
    expect(await isPending()).toBe(false);
  });

  it('markPending sets the flag, isPending reads it back', async () => {
    await markPending();
    expect(await isPending()).toBe(true);
  });

  it('markIdle clears the flag, isPending becomes false', async () => {
    await markPending();
    await markIdle();
    expect(await isPending()).toBe(false);
  });

  it('uses the spec-mandated AsyncStorage key', async () => {
    await markPending();
    expect(await AsyncStorage.getItem(AS_KEY_CLOUD_SYNC_PENDING)).toBe('true');
  });

  it('treats unknown string values as IDLE', async () => {
    await AsyncStorage.setItem(AS_KEY_CLOUD_SYNC_PENDING, 'false');
    expect(await isPending()).toBe(false);
    await AsyncStorage.setItem(AS_KEY_CLOUD_SYNC_PENDING, '0');
    expect(await isPending()).toBe(false);
  });
});