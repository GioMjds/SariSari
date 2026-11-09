import { fireEvent, render } from '@testing-library/react-native';
import { DeliveryLineRow } from '@/components/receiving/DeliveryLineRow';
import type { DraftLineForm } from '@/lib/deliveryForm';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const base: DraftLineForm = {
  key: 'k',
  productId: 1,
  productName: 'Soda',
  newProduct: null,
  enteredUnit: 'wholesale',
  retailUnitName: 'Pc',
  wholesaleUnitName: 'Case',
  conversionFactor: 24,
  lastCostPrice: 9,
  expectedQty: '3',
  receivedQty: '2',
  unitCost: '240',
};

describe('DeliveryLineRow', () => {
  it('shows a shortage chip in retail pieces when received is below expected', async () => {
    const { getByText } = await render(
      <DeliveryLineRow form={base} onChange={jest.fn()} onRemove={jest.fn()} />,
    );
    expect(getByText('shortageChip:{"count":24}')).toBeTruthy();
  });

  it('shows a cost-up chip comparing converted per-piece cost to the last cost', async () => {
    const { getByText } = await render(
      <DeliveryLineRow form={base} onChange={jest.fn()} onRemove={jest.fn()} />,
    );
    // 240 / 24 = 10 per piece, last cost 9, so +1
    expect(getByText(/costUpChip/)).toBeTruthy();
  });

  it('shows no chips when received equals expected and cost is unchanged', async () => {
    const { queryByText } = await render(
      <DeliveryLineRow
        form={{ ...base, receivedQty: '3', unitCost: '216' }}
        onChange={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(queryByText(/shortageChip/)).toBeNull();
    expect(queryByText(/costUpChip/)).toBeNull();
    expect(queryByText(/costDownChip/)).toBeNull();
  });

  it('shows no chips and does not crash on a blank or invalid line', async () => {
    const { queryByText } = await render(
      <DeliveryLineRow
        form={{ ...base, receivedQty: '', unitCost: '' }}
        onChange={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(queryByText(/shortageChip/)).toBeNull();
  });

  it('shows a validation message instead of chips for a fractional or negative qty', async () => {
    const { getAllByText, queryByText, rerender } = await render(
      <DeliveryLineRow
        form={{ ...base, receivedQty: '1.5' }}
        onChange={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(getAllByText('errorQtyWhole')).toHaveLength(1);
    expect(queryByText(/shortageChip/)).toBeNull();

    await rerender(
      <DeliveryLineRow
        form={{ ...base, expectedQty: '-2' }}
        onChange={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(getAllByText('errorQtyWhole')).toHaveLength(1);
  });

  it('parses the cost as pesos and asks for whole pesos on a centavo amount', async () => {
    const { getByText, queryByText, rerender } = await render(
      <DeliveryLineRow
        form={{ ...base, unitCost: '240.50' }}
        onChange={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(getByText('errorCostWhole')).toBeTruthy();
    expect(queryByText(/costUpChip/)).toBeNull();

    // Thousands separators and the peso sign are accepted by parsePesosInput.
    await rerender(
      <DeliveryLineRow
        form={{ ...base, receivedQty: '3', unitCost: '₱1,200' }}
        onChange={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(queryByText('errorCostWhole')).toBeNull();
    // 1200 / 24 = 50 per piece vs last 9.
    expect(getByText(/costUpChip/)).toBeTruthy();
  });

  it('switches the entry unit through the toggle', async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await render(
      <DeliveryLineRow form={base} onChange={onChange} onRemove={jest.fn()} />,
    );
    await fireEvent.press(getByLabelText('Pc'));
    expect(onChange).toHaveBeenCalledWith({ ...base, enteredUnit: 'retail' });
  });

  it('hides the unit toggle when the product has no wholesale unit', async () => {
    const { queryByLabelText } = await render(
      <DeliveryLineRow
        form={{
          ...base,
          enteredUnit: 'retail',
          wholesaleUnitName: null,
          conversionFactor: null,
        }}
        onChange={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(queryByLabelText('Case')).toBeNull();
  });
});
