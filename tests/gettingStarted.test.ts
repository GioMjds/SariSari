import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deriveGettingStarted,
  shouldShowGettingStarted,
} from '@/lib/gettingStarted';
import {
  GETTING_STARTED_DISMISSED_KEY,
  loadGettingStartedDismissed,
  setGettingStartedDismissed,
} from '@/lib/gettingStartedStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const storage = AsyncStorage as unknown as {
  getItem: jest.Mock;
  setItem: jest.Mock;
};

describe('deriveGettingStarted', () => {
  it('counts each finished task', () => {
    const p = deriveGettingStarted({
      productCount: 2,
      hasSales: false,
      customerCount: 0,
    });
    expect(p.tasks).toEqual([
      { id: 'product', done: true },
      { id: 'sale', done: false },
      { id: 'suki', done: false },
    ]);
    expect(p.doneCount).toBe(1);
    expect(p.total).toBe(3);
    expect(p.allDone).toBe(false);
  });

  it('is allDone when every task is done', () => {
    const p = deriveGettingStarted({
      productCount: 1,
      hasSales: true,
      customerCount: 1,
    });
    expect(p.allDone).toBe(true);
  });

  it('treats negative or non-finite counts as not done', () => {
    const p = deriveGettingStarted({
      productCount: -1,
      hasSales: false,
      customerCount: Number.NaN,
    });
    expect(p.doneCount).toBe(0);
  });
});

describe('shouldShowGettingStarted', () => {
  const partial = deriveGettingStarted({
    productCount: 1,
    hasSales: false,
    customerCount: 0,
  });
  const complete = deriveGettingStarted({
    productCount: 1,
    hasSales: true,
    customerCount: 1,
  });

  it('shows while tasks remain and not dismissed', () => {
    expect(shouldShowGettingStarted(partial, false)).toBe(true);
  });

  it('hides when dismissed', () => {
    expect(shouldShowGettingStarted(partial, true)).toBe(false);
  });

  it('hides when all done', () => {
    expect(shouldShowGettingStarted(complete, false)).toBe(false);
  });
});

describe('gettingStartedStorage', () => {
  beforeEach(() => {
    storage.getItem.mockReset();
    storage.setItem.mockReset();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('reads true only for the stored string "true"', async () => {
    storage.getItem.mockResolvedValueOnce('true');
    await expect(loadGettingStartedDismissed()).resolves.toBe(true);
    expect(storage.getItem).toHaveBeenCalledWith(GETTING_STARTED_DISMISSED_KEY);
  });

  it('reads false when nothing is stored', async () => {
    storage.getItem.mockResolvedValueOnce(null);
    await expect(loadGettingStartedDismissed()).resolves.toBe(false);
  });

  it('reads false for a corrupted value', async () => {
    storage.getItem.mockResolvedValueOnce('{not json');
    await expect(loadGettingStartedDismissed()).resolves.toBe(false);
  });

  it('reads false when storage throws', async () => {
    storage.getItem.mockRejectedValueOnce(new Error('boom'));
    await expect(loadGettingStartedDismissed()).resolves.toBe(false);
  });

  it('writes "true" and swallows a failing write', async () => {
    storage.setItem.mockResolvedValueOnce(undefined);
    await setGettingStartedDismissed();
    expect(storage.setItem).toHaveBeenCalledWith(
      GETTING_STARTED_DISMISSED_KEY,
      'true',
    );

    storage.setItem.mockRejectedValueOnce(new Error('disk full'));
    await expect(setGettingStartedDismissed()).resolves.toBeUndefined();
  });
});
