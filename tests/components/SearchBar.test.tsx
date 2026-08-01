import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SearchBar } from '../../components/ui/SearchBar';

describe('SearchBar Component', () => {
  test('renders cleanly when value is undefined', async () => {
    await render(
      <SearchBar value={undefined as unknown as string} onChange={jest.fn()} />,
    );
    expect(screen.getByLabelText('Search')).toBeTruthy();
  });

  test('renders initial text value without error', async () => {
    await render(<SearchBar value="hello" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Search')).toBeTruthy();
    // FontAwesome mock renders the icon `name` as a Text child
    expect(screen.getByText('times')).toBeTruthy();
  });

  test('emits onChange synchronously when debounceMs is 0', async () => {
    const onChange = jest.fn();
    await render(<SearchBar value="" onChange={onChange} debounceMs={0} />);
    fireEvent.changeText(screen.getByLabelText('Search'), 'hi');
    expect(onChange).toHaveBeenCalledWith('hi');
  });

  test('re-syncs local input when parent value changes', async () => {
    const onChange = jest.fn();
    const view = await render(<SearchBar value="foo" onChange={onChange} />);
    expect(screen.getByLabelText('Search').props.value).toBe('foo');
    await view.rerender(<SearchBar value="bar" onChange={onChange} />);
    expect(screen.getByLabelText('Search').props.value).toBe('bar');
  });
});
