import { View, type ViewProps } from 'react-native';
import { Children, type ReactNode } from 'react';

export type MoreHeroStripProps = ViewProps & {
  children: ReactNode;
};

export function MoreHeroStrip({
  children,
  testID,
  ...rest
}: MoreHeroStripProps) {
  const childArray = Children.toArray(children);
  return (
    <View testID={testID} className="bg-cinnamon-500 px-4 pt-2 pb-4" {...rest}>
      <View className="flex-row gap-3">
        {childArray.map((child, index) => (
          <View key={index} className="flex-1">
            {child}
          </View>
        ))}
      </View>
    </View>
  );
}
