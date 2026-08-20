const mockRouter = {
  navigate: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(),
};

jest.unmock('expo-router');
jest.doMock('expo-router', () => ({
  router: mockRouter,
}));

import { act, renderHook } from '@testing-library/react-native';

const { MORE_ROUTES, goBackToMore } =
  require('@/components/more/moreNavigation') as typeof import('@/components/more/moreNavigation');
const { useMoreDestinationNavigation } =
  require('@/components/more/useMoreDestinationNavigation') as typeof import('@/components/more/useMoreDestinationNavigation');

describe('More navigation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('falls back to More when a deep link has no history', () => {
    mockRouter.canGoBack.mockReturnValue(false);

    goBackToMore();

    expect(mockRouter.replace).toHaveBeenCalledWith(MORE_ROUTES.home);
  });

  it('uses normal back navigation when history exists', () => {
    mockRouter.canGoBack.mockReturnValue(true);

    goBackToMore();

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('ignores rapid duplicate destination presses', async () => {
    const { result, unmount } = await renderHook(() =>
      useMoreDestinationNavigation(),
    );

    await act(() => {
      result.current(MORE_ROUTES.reports);
      result.current(MORE_ROUTES.reports);
    });
    expect(mockRouter.navigate).toHaveBeenCalledTimes(1);

    await act(() => {
      jest.advanceTimersByTime(500);
    });
    await act(() => {
      result.current(MORE_ROUTES.reports);
    });
    expect(mockRouter.navigate).toHaveBeenCalledTimes(2);

    await unmount();
  });
});
