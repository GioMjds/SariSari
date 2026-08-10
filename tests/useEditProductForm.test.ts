import { renderHook, act } from '@testing-library/react-native';
import { useEditProductForm } from '@/components/inventory/edit-product/useEditProductForm';
import { useProducts, useGetProduct, useCategories, useBarcodeResolver } from '@/hooks';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: () => ({ id: '1' }),
}));

jest.mock('@/hooks', () => ({
  useProducts: jest.fn(),
  useGetProduct: jest.fn(),
  useCategories: jest.fn(),
  useBarcodeResolver: jest.fn(),
}));

describe('useEditProductForm', () => {
  const mockMutateAsync = jest.fn();
  const mockDeleteMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useProducts as jest.Mock).mockReturnValue({
      updateProductMutation: { isPending: false, mutateAsync: mockMutateAsync },
      deleteProductMutation: { isPending: false, mutateAsync: mockDeleteMutateAsync },
      getAllProductsQuery: { data: [] },
    });

    (useCategories as jest.Mock).mockReturnValue({
      getAllCategoriesQuery: { data: [{ id: 1, name: 'Beverages' }] },
    });

    (useGetProduct as jest.Mock).mockReturnValue({
      data: {
        id: 1,
        name: 'Coke 1.5L',
        sku: 'CK-001',
        barcode: '123456789012',
        price: 65,
        cost_price: 50,
        quantity: 10,
        category: 'Beverages',
        supplier_id: 'sup-1',
        image_uri: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        is_favorite: false,
      },
      isLoading: false,
    });

    (useBarcodeResolver as jest.Mock).mockReturnValue({
      resolve: jest.fn(),
    });
  });

  it('initializes with product values', async () => {
    const { result } = await renderHook(() => useEditProductForm());

    expect(result.current.name).toBe('Coke 1.5L');
    expect(result.current.price).toBe('65');
    expect(result.current.costPerPiece).toBe('50');
    expect(result.current.initialStock).toBe('10');
    expect(result.current.category).toBe('Beverages');
    expect(result.current.supplierId).toBe('sup-1');
  });

  it('computes profit per piece and markup percent', async () => {
    const { result } = await renderHook(() => useEditProductForm());

    expect(result.current.profitPerPiece).toBe(15);
    expect(result.current.markupPercent).toBeCloseTo(30);
    expect(result.current.isLossWarning).toBe(false);
  });

  it('bumps stock correctly', async () => {
    const { result } = await renderHook(() => useEditProductForm());

    await act(async () => {
      result.current.bumpStock(5);
    });

    expect(result.current.initialStock).toBe('15');
  });

  it('applies markup preset correctly', async () => {
    const { result } = await renderHook(() => useEditProductForm());

    await act(async () => {
      result.current.applyMarkupPreset(0.2); // 20%
    });

    expect(result.current.price).toBe('60.00');
  });
});
