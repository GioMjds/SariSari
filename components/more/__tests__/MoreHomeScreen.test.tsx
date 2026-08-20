import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import i18n, { initI18n } from '@/lib/i18n';
import type { Pesos } from '@/lib/money';
import { formatLocalBackupTimestamp } from '@/components/more/formatLocalBackupTimestamp';

const mockRouter = {
  navigate: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(),
};
const mockUseFinancialTotals = jest.fn();
const mockUseLocalSnapshots = jest.fn();
const mockUseTabBarBottomOffset = jest.fn();
let mockWindowWidth = 375;

jest.unmock('expo-router');
jest.doMock('expo-router', () => ({
  router: mockRouter,
  usePathname: () => '/more',
  useRouter: () => mockRouter,
}));

jest.mock('@/hooks', () => ({
  useFinancialTotals: mockUseFinancialTotals,
  useLocalSnapshots: mockUseLocalSnapshots,
}));

jest.mock('@/utils', () => ({
  getTodayDateString: () => '2026-08-14',
}));

jest.mock('@/components/layout', () => ({
  useTabBarBottomOffset: mockUseTabBarBottomOffset,
}));

const { MoreHomeScreen } =
  require('@/components/more/MoreHomeScreen') as typeof import('@/components/more/MoreHomeScreen');
const { MORE_ROUTES } =
  require('@/components/more/moreNavigation') as typeof import('@/components/more/moreNavigation');

const rendererImplementation =
  require('react-native/Libraries/ReactNative/RendererImplementation') as {
    findNodeHandle: (componentOrHandle: unknown) => number | null;
  };

const readyFinancialTotals = {
  isLoading: false,
  isError: false,
  data: {
    paidExpenses: 125 as Pesos,
    ownerDrawings: 25 as Pesos,
  },
};

const emptySnapshots = {
  isLoading: false,
  isError: false,
  data: [],
};

describe('MoreHomeScreen', () => {
  beforeAll(async () => {
    await initI18n();
    await i18n.changeLanguage('en');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowWidth = 375;
    mockUseFinancialTotals.mockReturnValue(readyFinancialTotals);
    mockUseLocalSnapshots.mockReturnValue(emptySnapshots);
    mockUseTabBarBottomOffset.mockReturnValue(80);
    jest.spyOn(rendererImplementation, 'findNodeHandle').mockReturnValue(42);
    jest
      .spyOn(AccessibilityInfo, 'setAccessibilityFocus')
      .mockImplementation(() => undefined);
    jest
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    jest
      .spyOn(require('react-native'), 'useWindowDimensions')
      .mockImplementation(() => ({
        width: mockWindowWidth,
        height: 812,
        scale: 1,
        fontScale: 1,
      }));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('exports the production landing screen without a feature guard', () => {
    expect(MoreHomeScreen.name).toBe('MoreHomeScreen');
  });

  it('renders the three current destinations in reading order', async () => {
    const screen = await render(<MoreHomeScreen />);
    const buttons = screen.container.queryAll(
      (node) => node.props['accessibilityRole'] === 'button',
    );

    expect(buttons).toHaveLength(3);
    expect(buttons.map((button) => button.props['accessibilityLabel'])).toEqual(
      [
        'Cash & expenses. Expenses ₱125.00 · Owner drawings ₱25.00. Review cash',
        'Backup & restore. No backup yet',
        'Settings & security. Store, language, Owner PIN, and preferences',
      ],
    );

    for (const removedLabel of [
      'POS',
      'Receipts',
      'Products',
      'All customers',
      'Help',
      'About SariSari',
      "Today's almanac",
      'Sales trend',
      'Top products',
    ]) {
      expect(screen.queryByText(removedLabel)).toBeNull();
    }
    expect(mockUseFinancialTotals).toHaveBeenCalledWith(
      '2026-08-14',
      '2026-08-14',
    );

    await screen.unmount();
  });

  it.each([
    [
      { isLoading: true, isError: false, data: undefined },
      "Checking today's movements",
    ],
    [
      {
        isLoading: false,
        isError: false,
        data: { paidExpenses: 0 as Pesos, ownerDrawings: 0 as Pesos },
      },
      'No expenses or owner drawings recorded today',
    ],
    [
      {
        isLoading: false,
        isError: false,
        data: {
          paidExpenses: 750 as Pesos,
          ownerDrawings: 200 as Pesos,
        },
      },
      'Expenses ₱750.00 · Owner drawings ₱200.00',
    ],
    [
      { isLoading: false, isError: true, data: undefined },
      "Open to check today's expenses and owner drawings",
    ],
  ])('maps a financial query state to %s', async (queryState, expectedText) => {
    mockUseFinancialTotals.mockReturnValue(queryState);

    const screen = await render(<MoreHomeScreen />);

    expect(screen.getByText(expectedText)).toBeTruthy();
    await screen.unmount();
  });

  it.each([
    [
      { isLoading: true, isError: false, data: undefined },
      'Checking local backup',
    ],
    [{ isLoading: false, isError: false, data: [] }, 'No backup yet'],
    [
      { isLoading: false, isError: true, data: undefined },
      'Check backup status',
    ],
  ])('maps a snapshot query state to %s', async (queryState, expectedText) => {
    mockUseLocalSnapshots.mockReturnValue(queryState);

    const screen = await render(<MoreHomeScreen />);

    expect(screen.getByText(expectedText)).toBeTruthy();
    await screen.unmount();
  });

  it('uses only the newest local snapshot for backup helper text', async () => {
    const newest = Date.UTC(2026, 7, 14, 8, 30);
    const older = Date.UTC(2026, 7, 10, 9, 15);
    mockUseLocalSnapshots.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          path: '/auto/newest.db',
          bytes: 1024,
          createdAt: newest,
          kind: 'auto',
        },
        { path: '/auto/older.db', bytes: 512, createdAt: older, kind: 'auto' },
      ],
    });

    const screen = await render(<MoreHomeScreen />);

    expect(
      screen.getByText(
        `Latest local backup: ${formatLocalBackupTimestamp(newest, 'en')}`,
      ),
    ).toBeTruthy();
    expect(
      screen.queryByText(
        `Latest local backup: ${formatLocalBackupTimestamp(older, 'en')}`,
      ),
    ).toBeNull();
    await screen.unmount();
  });

  it('uses canonical destinations and ignores rapid duplicate presses', async () => {
    jest.useFakeTimers();
    const screen = await render(<MoreHomeScreen />);
    const destinations = [
      [
        'Cash & expenses. Expenses ₱125.00 · Owner drawings ₱25.00. Review cash',
        MORE_ROUTES.cash,
      ],
      ['Backup & restore. No backup yet', MORE_ROUTES.backup],
      [
        'Settings & security. Store, language, Owner PIN, and preferences',
        MORE_ROUTES.settings,
      ],
    ] as const;

    for (const [label, route] of destinations) {
      await fireEvent.press(screen.getByLabelText(label));
      expect(mockRouter.navigate).toHaveBeenLastCalledWith(route);
      await act(() => {
        jest.advanceTimersByTime(500);
      });
    }

    mockRouter.navigate.mockClear();
    const backup = screen.getByLabelText('Backup & restore. No backup yet');
    await fireEvent.press(backup);
    await fireEvent.press(backup);
    expect(mockRouter.navigate).toHaveBeenCalledTimes(1);

    await screen.unmount();
  });

  it('uses responsive centered content and tab-safe bottom padding', async () => {
    const phone = await render(<MoreHomeScreen />);
    const phoneContent = phone.container.queryAll(
      (node) => StyleSheet.flatten(node.props['style'])?.maxWidth === 640,
    )[0];
    const phoneScroll = phone.container.queryAll(
      (node) => node.type === 'RCTScrollView',
    )[0];

    expect(StyleSheet.flatten(phoneContent?.props['style'])).toMatchObject({
      width: '100%',
      maxWidth: 640,
      alignSelf: 'center',
      paddingHorizontal: 16,
    });
    expect(
      StyleSheet.flatten(phoneScroll?.props['contentContainerStyle']),
    ).toMatchObject({ paddingBottom: 96 });
    expect(phoneScroll?.props['showsVerticalScrollIndicator']).toBe(false);
    await phone.unmount();

    mockWindowWidth = 1024;
    const tablet = await render(<MoreHomeScreen />);
    const tabletContent = tablet.container.queryAll(
      (node) => StyleSheet.flatten(node.props['style'])?.maxWidth === 640,
    )[0];
    expect(StyleSheet.flatten(tabletContent?.props['style'])).toMatchObject({
      paddingHorizontal: 24,
    });
    await tablet.unmount();
  });
});
