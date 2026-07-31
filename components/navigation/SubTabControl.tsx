import React from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export interface SubTabItem<T extends string> {
  key: T;
  label: string;
  icon?: keyof typeof FontAwesome.glyphMap;
  badgeCount?: number;
}

export interface SubTabControlProps<T extends string> {
  tabs: SubTabItem<T>[];
  activeTab: T;
  onTabPress: (tab: T) => void;
  containerClassName?: string;
}

export function SubTabControl<T extends string>({
  tabs,
  activeTab,
  onTabPress,
  containerClassName = 'mb-3',
}: SubTabControlProps<T>) {
  const handleSelect = (tabKey: T) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onTabPress(tabKey);
  };

  return (
    <View
      accessibilityRole="tablist"
      className={`flex-row bg-paper-100 p-1 rounded-2xl border border-paper-300 ${containerClassName}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => handleSelect(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
            className={`flex-1 min-h-[44px] py-2 rounded-xl flex-row items-center justify-center border ${
              isActive
                ? 'bg-paper-50 shadow-sm border-paper-300'
                : 'bg-transparent border-transparent shadow-none'
            }`}
          >
            {tab.icon ? (
              <FontAwesome
                name={tab.icon}
                size={12}
                color={isActive ? '#E85A1F' : '#7A7165'}
                style={{ marginRight: 5 }}
              />
            ) : null}
            <StyledText
              variant={isActive ? 'extrabold' : 'semibold'}
              className={`text-xs uppercase tracking-wider ${
                isActive ? 'text-ink-900' : 'text-ink-500'
              }`}
            >
              {tab.label}
            </StyledText>
            {tab.badgeCount && tab.badgeCount > 0 ? (
              <View className="ml-1.5 bg-cinnamon-500 rounded-full w-5 h-5 items-center justify-center">
                <StyledText
                  variant="extrabold"
                  className="text-paper-50 text-[11px]"
                >
                  {tab.badgeCount}
                </StyledText>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
