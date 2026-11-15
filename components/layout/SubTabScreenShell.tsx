import { ReactNode } from 'react';
import { View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { SubTabControl, SubTabItem } from '@/components/navigation';

export interface SubTabScreenShellProps<T extends string> {
  tabs: SubTabItem<T>[];
  activeTab: T;
  onTabPress: (tab: T) => void;
  progress: SharedValue<number>;
  belowTabsSlot?: ReactNode;
  children: ReactNode;
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
