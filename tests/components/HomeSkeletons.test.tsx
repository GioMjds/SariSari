import React from 'react';
import { render } from '@testing-library/react-native';
import {
  HomeOverviewSkeleton,
  TodaySnapshotSkeleton,
  HomeAlertsSkeleton,
} from '@/components/home';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('Home Sub-Tab Loading Skeletons', () => {
  test('renders HomeOverviewSkeleton cleanly without errors', async () => {
    const { toJSON } = await render(<HomeOverviewSkeleton />);
    expect(toJSON()).toBeTruthy();
  });

  test('renders TodaySnapshotSkeleton cleanly without errors', async () => {
    const { toJSON } = await render(<TodaySnapshotSkeleton />);
    expect(toJSON()).toBeTruthy();
  });

  test('renders HomeAlertsSkeleton cleanly without errors', async () => {
    const { toJSON } = await render(<HomeAlertsSkeleton />);
    expect(toJSON()).toBeTruthy();
  });
});
