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
   * Header content rendered above the sub-tab bar. Pass `null` to suppress
   * the header entirely (e.g., detail screens where the per-tab header
   * is hidden). Accepts any ReactNode — typically the per-tab `*Header.tsx`
   * component or a fragment composing header + banner.
   */
  topSlot?: ReactNode;
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
  topSlot,
  children,
  containerClassName = 'flex-1 bg-paper-200',
}: SubTabScreenShellProps<T>) {
  return (
    <View className={containerClassName}>
      <Stack.Screen options={{ headerShown: false }} />
      {topSlot}
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
      <View className="flex-1 bg-paper-200 relative">{children}</View>
    </View>
  );
}
