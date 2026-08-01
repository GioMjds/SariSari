import { DashboardSuggestions } from '@/components/home/DashboardSuggestions';
import { HomeRecommendation } from '@/components/home/home-state';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (typeof key === 'string' && key.includes('outOfStock.title'))
        return 'Items out of stock';
      if (typeof key === 'string' && key.includes('outOfStock.description'))
        return `You have ${options?.count || 1} items out of stock.`;
      if (typeof key === 'string' && key.includes('outOfStock.cta'))
        return 'Restock Inventory';
      if (typeof key === 'string' && key.includes('continueSelling.title'))
        return 'Store is active';
      if (typeof key === 'string' && key.includes('continueSelling.cta'))
        return 'New Sale';
      if (typeof key === 'string' && key.includes('dashboardTitle'))
        return 'Counter Command Center';
      if (typeof key === 'string' && key.includes('dashboardSubtitle'))
        return 'Store Assistant Active';
      if (typeof key === 'string' && key.includes('drawerActive'))
        return 'Drawer Active';
      if (typeof key === 'string' && key.includes('drawerClosed'))
        return 'Drawer Closed';
      return options?.defaultValue || key;
    },
  }),
}));

describe('Guided Recommendation Components', () => {
  describe('DashboardSuggestions', () => {
    test('renders suggestion card and fires onPress callback with destination', async () => {
      const handlePress = jest.fn();
      const rec: HomeRecommendation = {
        kind: 'continueSelling',
        destination: 'newSale',
      };

      const { getByText } = await render(
        <DashboardSuggestions suggestions={[rec]} onPress={handlePress} />,
      );

      const itemText = getByText('New Sale');
      expect(itemText).toBeTruthy();
      fireEvent.press(itemText);
      expect(handlePress).toHaveBeenCalledWith('newSale');
    });
  });
});
