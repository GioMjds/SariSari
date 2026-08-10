import { View, type ViewProps } from 'react-native';
import { Children, type ReactNode } from 'react';

export type MoreTileGridProps = ViewProps & {
  columns?: number;
  children: ReactNode;
};

export function MoreTileGrid({
  columns = 3,
  children,
  testID,
  ...rest
}: MoreTileGridProps) {
  const totalSlots = columns;
  const childArray = Children.toArray(children);
  const fillerCount =
    (totalSlots - (childArray.length % totalSlots)) % totalSlots;

  return (
    <View
      testID={testID}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}
      {...rest}
    >
      {childArray.map((child, index) => (
        <View
          key={index}
          style={{
            width: `${100 / columns}%`,
            paddingHorizontal: 6,
            boxSizing: 'border-box',
          }}
        >
          {child}
        </View>
      ))}
      {Array.from({ length: fillerCount }).map((_, index) => (
        <View
          key={`filler-${index}`}
          style={{
            width: `${100 / columns}%`,
            paddingHorizontal: 6,
          }}
          aria-hidden
        />
      ))}
    </View>
  );
}
