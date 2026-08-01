import React from 'react';
import { render } from '@testing-library/react-native';
import {
  HomeOverviewSkeleton,
  TodaySnapshotSkeleton,
} from '@/components/home';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  withLayoutContext: (comp: any) => comp,
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
});
