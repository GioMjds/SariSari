import React from 'react';
import { render } from '@testing-library/react-native';
import { ChartEmptyState } from '@/components/inventory/analytics/ChartEmptyState';

describe('ChartEmptyState', () => {
  it('renders the supplied message', async () => {
    const { getByText } = await render(
      <ChartEmptyState message="No data yet" />,
    );
    expect(getByText('No data yet')).toBeTruthy();
  });
});
