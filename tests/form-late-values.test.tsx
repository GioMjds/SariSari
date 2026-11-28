// Regression: the edit product form blocked Save with "Add a product name" because useWatch ignored late-loaded values.
import { act, renderHook } from '@testing-library/react-native';
import { useController, useForm } from 'react-hook-form';
import {
  PRODUCT_FORM_DEFAULTS,
  type ProductFormData,
} from '@/components/inventory/products/form/types';

const loaded = { ...PRODUCT_FORM_DEFAULTS, productName: 'Sardines', price: '25' };

const useEditLike = ({ values }: { values: ProductFormData }) => {
  const f = useForm<ProductFormData>({
    defaultValues: values,
    values,
    resetOptions: { keepDirtyValues: true, keepDirty: true },
  });
  const [name, price] = f.watch(['productName', 'price']);
  const c = useController({ control: f.control, name: 'expiryDate' });
  return { name, price, isDirty: f.formState.isDirty, c };
};

it('cached product: name survives an expiry change', async () => {
  const { result } = await renderHook(useEditLike, {
    initialProps: { values: loaded },
  });
  expect(result.current.name).toBe('Sardines');
  await act(async () => result.current.c.field.onChange('2026-12-05'));
  expect(result.current.isDirty).toBe(true);
  expect(result.current.name).toBe('Sardines');
  expect(result.current.price).toBe('25');
});

it('cold load: name appears after values arrive late', async () => {
  const { result, rerender } = await renderHook(useEditLike, {
    initialProps: { values: PRODUCT_FORM_DEFAULTS },
  });
  await rerender({ values: loaded });
  await act(async () => {});
  expect(result.current.name).toBe('Sardines');
});

it('cached product: name survives a refetch (new values object) after expiry change', async () => {
  const { result, rerender } = await renderHook(useEditLike, {
    initialProps: { values: loaded },
  });
  await act(async () => result.current.c.field.onChange('2026-12-05'));
  await rerender({ values: { ...loaded } });
  await act(async () => {});
  expect(result.current.isDirty).toBe(true);
  expect(result.current.name).toBe('Sardines');
});
