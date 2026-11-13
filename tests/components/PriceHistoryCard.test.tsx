import { render } from '@testing-library/react-native';
import type { PriceChange } from '@/types/pricing.types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

let mockHistory: PriceChange[] | undefined = [];
jest.mock('@/hooks/usePriceHistory', () => ({
  usePriceHistory: () => ({ data: mockHistory }),
}));

import { PriceHistoryCard } from '@/components/pricing/PriceHistoryCard';

const change = (over: Partial<PriceChange>): PriceChange => ({
  id: 1,
  productId: 7,
  field: 'cost',
  oldValue: 10,
  newValue: 12,
  source: 'delivery',
  receiptId: 4,
  createdAt: '2026-11-13T02:00:00.000Z',
  ...over,
});

describe('PriceHistoryCard', () => {
  it('renders nothing when there is no history', async () => {
    mockHistory = [];
    const { toJSON } = await render(<PriceHistoryCard productId={7} />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing while history is still loading', async () => {
    mockHistory = undefined;
    const { toJSON } = await render(<PriceHistoryCard productId={7} />);
    expect(toJSON()).toBeNull();
  });

  it('shows a cost change with its source', async () => {
    mockHistory = [change({})];
    const { getByText } = await render(<PriceHistoryCard productId={7} />);
    expect(getByText('historyTitle')).toBeTruthy();
    expect(getByText('historyCost')).toBeTruthy();
    expect(
      getByText('historyChange:{"from":"₱10.00","to":"₱12.00"}'),
    ).toBeTruthy();
    expect(getByText(/sourceDelivery/)).toBeTruthy();
  });

  it('shows a first value without an old value', async () => {
    mockHistory = [
      change({
        id: 2,
        field: 'price',
        oldValue: null,
        newValue: 15,
        source: 'manual_edit',
      }),
    ];
    const { getByText } = await render(<PriceHistoryCard productId={7} />);
    expect(getByText('historyPrice')).toBeTruthy();
    expect(getByText('historyFirst:{"to":"₱15.00"}')).toBeTruthy();
    expect(getByText(/sourceManualEdit/)).toBeTruthy();
  });

  it('labels restock and reprice sources', async () => {
    mockHistory = [
      change({ id: 3, source: 'restock' }),
      change({ id: 4, field: 'price', source: 'reprice' }),
    ];
    const { getByText } = await render(<PriceHistoryCard productId={7} />);
    expect(getByText(/sourceRestock/)).toBeTruthy();
    expect(getByText(/sourceReprice/)).toBeTruthy();
  });
});
