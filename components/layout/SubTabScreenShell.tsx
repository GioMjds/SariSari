import { ReactNode } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { SharedValue } from 'react-native-reanimated';
import { SubTabControl, SubTabItem } from '@/components/navigation';

export interface SubTabScreenShellProps<T extends string> {
  /** Sub-tab definitions rendered in the top bar (left to right). */
  tabs: SubTabItem<T>[];
  /** Currently active sub-tab key. */
  activeTab: T;
  /** Called when the user taps a different sub-tab. */
  onTabPress: (tab: T) => void;
  /** Shared progress value from `useTabProgress` driving the underline tween. */
  progress: SharedValue<number>;
  /**
   * Content rendered between the sub-tab bar and the screen content.
   * Use for cards/banners that should sit just under the tabs rather
   * than at the very top of the screen.
   */
  belowTabsSlot?: ReactNode;
  /** The TopTabs navigator with screens mounted as children. */
  children: ReactNode;
  /**
   * Tailwind className applied to the outermost container.
   * Default: `'flex-1 bg-paper-200'`.
   */
  containerClassName?: string;
}

export function SubTabScreenShell<T extends string>({
  tabs,
  activeTab,
  onTabPress,
  progress,
  belowTabsSlot,
  children,
  containerClassName = 'flex-1 bg-paper-200',
}: SubTabScreenShellProps<T>) {
  return (
    <View className={containerClassName}>
      <Stack.Screen options={{ headerShown: false }} />
      {tabs.length > 0 ? (
        <View className="bg-paper-200 px-4 pt-1 pb-2">
          <SubTabControl
            tabs={tabs}
            activeTab={activeTab}
            onTabPress={onTabPress}
            progress={progress}
          />
        </View>
      ) : null}
      {belowTabsSlot}
      <View className="flex-1 bg-paper-200 relative">{children}</View>
    </View>
  );
}
