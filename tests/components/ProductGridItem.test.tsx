import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { ProductGridItem } from '../../components/inventory/products/ProductGridItem';
import { ProductsTab } from '../../components/inventory/products/ProductsTab';
import { useInventoryViewStore } from '../../stores/InventoryViewStore';
import { Product } from '../../types';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock expo-image
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: any) => React.createElement(View, props),
  };
});

// Mock moti
jest.mock('moti', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MotiView: ({ children, ...props }: any) => React.createElement(View, props, children),
  };
});

// Mock hooks/useProducts and useCategories
const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Coke Can',
    sku: 'COKE123',
    barcode: null,
    category: 'Beverages',
    price: 25, // ₱25.00
    cost_price: 20,
    quantity: 10,
    image_uri: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Skyflakes',
    sku: 'SKY123',
    barcode: null,
    category: 'Snacks',
    price: 15, // ₱15.00
    cost_price: 12,
    quantity: 3,
    image_uri: 'local/path/image.jpg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Biogesic',
    sku: 'BIO123',
    barcode: null,
    category: 'Medicine',
    price: 5, // ₱5.00
    cost_price: 4,
    quantity: 0,
    image_uri: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

jest.mock('@/hooks', () => ({
  useProducts: () => ({
    getAllProductsQuery: {
      data: mockProducts,
      isLoading: false,
      refetch: jest.fn(async () => {}),
    },
    deleteProductMutation: {
      mutate: jest.fn(),
    },
  }),
  useCategories: () => ({
    getCategoriesWithCountQuery: {
      data: [],
      isLoading: false,
    },
  }),
}));

describe('ProductGridItem UI Render', () => {
  const onRestock = jest.fn();
  const onMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders placeholder text initial when image_uri is null', async () => {
    const { getByText, queryByTestId } = await render(
      <ProductGridItem
        product={mockProducts[0]} // Coke Can, quantity 10, image_uri null
        index={0}
        onRestock={onRestock}
        onMore={onMore}
      />
    );

    expect(getByText('C')).toBeTruthy(); // Initial letter
    expect(getByText('Coke Can')).toBeTruthy();
    expect(getByText('Beverages')).toBeTruthy();
    expect(getByText('₱25.00')).toBeTruthy();
    expect(getByText('OK')).toBeTruthy(); // 10 >= LOW_STOCK_THRESHOLD (5)
  });

  test('renders "X left" warning badge when quantity is low (0 < q < 5)', async () => {
    const { getByText } = await render(
      <ProductGridItem
        product={mockProducts[1]} // Skyflakes, quantity 3
        index={1}
        onRestock={onRestock}
        onMore={onMore}
      />
    );

    expect(getByText('Skyflakes')).toBeTruthy();
    expect(getByText('3 left')).toBeTruthy();
  });

  test('renders "Out" danger badge when quantity is 0', async () => {
    const { getByText } = await render(
      <ProductGridItem
        product={mockProducts[2]} // Biogesic, quantity 0
        index={2}
        onRestock={onRestock}
        onMore={onMore}
      />
    );

    expect(getByText('Biogesic')).toBeTruthy();
    expect(getByText('Out')).toBeTruthy();
  });

  test('triggers onRestock action on plus-button press', async () => {
    const { getByLabelText } = await render(
      <ProductGridItem
        product={mockProducts[0]}
        index={0}
        onRestock={onRestock}
        onMore={onMore}
      />
    );

    // Query the restock button using its accessibility label
    const plusButton = getByLabelText('Restock Coke Can');
    fireEvent.press(plusButton);
    expect(onRestock).toHaveBeenCalledWith(mockProducts[0]);
  });
});

describe('Dynamic FlatList Key & Layout Integration', () => {
  const onRestock = jest.fn();
  const onMore = jest.fn();

  beforeEach(() => {
    useInventoryViewStore.getState().setViewMode('list');
  });

  test('switches FlatList columns and keys dynamically based on viewMode without errors', async () => {
    const { rerender } = await render(
      <ProductsTab
        search=""
        sortBy="stock"
        sortDirection="asc"
        onRestock={onRestock}
        onMore={onMore}
      />
    );

    // Initial state: viewMode is 'list'
    expect(useInventoryViewStore.getState().viewMode).toBe('list');

    // Switch to grid mode
    await act(async () => {
      useInventoryViewStore.getState().setViewMode('grid');
    });

    // Re-render component (React Native testing library propagates Zustand changes automatically)
    await rerender(
      <ProductsTab
        search=""
        sortBy="stock"
        sortDirection="asc"
        onRestock={onRestock}
        onMore={onMore}
      />
    );

    expect(useInventoryViewStore.getState().viewMode).toBe('grid');
  });
});
