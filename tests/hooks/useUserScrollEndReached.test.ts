import { act, renderHook } from '@testing-library/react-native';
import { useUserScrollEndReached } from '@/hooks/useUserScrollEndReached';

describe('useUserScrollEndReached', () => {
  it('ignores end-reached events until the user drags', async () => {
    const load = jest.fn();
    const { result } = await renderHook(() => useUserScrollEndReached(load));

    await act(async () => result.current.onEndReached());
    expect(load).not.toHaveBeenCalled();

    await act(async () => result.current.onScrollBeginDrag());
    await act(async () => result.current.onEndReached());
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('loads at most one page per drag', async () => {
    const load = jest.fn();
    const { result } = await renderHook(() => useUserScrollEndReached(load));

    await act(async () => result.current.onScrollBeginDrag());
    await act(async () => result.current.onEndReached());
    await act(async () => result.current.onEndReached());
    expect(load).toHaveBeenCalledTimes(1);
  });
});
