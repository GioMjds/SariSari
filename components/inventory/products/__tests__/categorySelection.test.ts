import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAddProductForm } from '../add-product/useAddProductForm';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
  useLocalSearchParams: () => ({}),
}));

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useAddProductForm category selection', () => {
  it('toggles category on and off correctly', async () => {
    const { result } = renderHook(() => useAddProductForm(), {
      wrapper: createWrapper(),
    });

    expect(result.current.category).toBe('');

    // Select category 'Beverages'
    act(() => {
      result.current.selectCategory('Beverages');
    });

    expect(result.current.category).toBe('Beverages');

    // Deselect category 'Beverages' by selecting it again
    act(() => {
      result.current.selectCategory('Beverages');
    });

    expect(result.current.category).toBe('');
  });

  it('maintains stable selectCategory function reference across category changes', async () => {
    const { result, rerender } = renderHook(() => useAddProductForm(), {
      wrapper: createWrapper(),
    });

    const initialSelectCategory = result.current.selectCategory;

    act(() => {
      result.current.selectCategory('Snacks');
    });

    rerender({});

    expect(result.current.selectCategory).toBe(initialSelectCategory);
  });
});
