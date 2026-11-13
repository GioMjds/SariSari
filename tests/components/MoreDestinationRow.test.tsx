import { render } from '@testing-library/react-native';
import { MoreDestinationRow } from '@/components/more/MoreDestinationRow';

const baseProps = {
  icon: 'tag' as const,
  title: 'Needs repricing',
  supportingText: 'Sub',
  onPress: jest.fn(),
  accessibilityLabel: 'Needs repricing. Sub',
};

describe('MoreDestinationRow badge', () => {
  it('shows the count when badgeCount is above zero', async () => {
    const { getByText } = await render(
      <MoreDestinationRow {...baseProps} badgeCount={3} />,
    );
    expect(getByText('3')).toBeTruthy();
  });

  it('caps the label at 99+', async () => {
    const { getByText } = await render(
      <MoreDestinationRow {...baseProps} badgeCount={250} />,
    );
    expect(getByText('99+')).toBeTruthy();
  });

  it('shows no badge when badgeCount is zero or missing', async () => {
    const zero = await render(
      <MoreDestinationRow {...baseProps} badgeCount={0} />,
    );
    expect(zero.queryByText('0')).toBeNull();
    const missing = await render(<MoreDestinationRow {...baseProps} />);
    expect(missing.queryByTestId('more-row-badge')).toBeNull();
  });
});
