import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { CustomersSubTab } from './CustomersHeader';

interface CustomersFloatingNavProps {
  activeTab: CustomersSubTab;
  onTabPress: (tab: CustomersSubTab) => void;
  bottomOffset?: number;
}

export const CustomersFloatingNav: React.FC<CustomersFloatingNavProps> = ({
  activeTab,
  onTabPress,
  bottomOffset = 16,
}) => {
  const tabs: {
    key: CustomersSubTab;
    label: string;
    icon: keyof typeof FontAwesome.glyphMap;
  }[] = [
    { key: 'all', label: 'ALL', icon: 'users' },
    { key: 'credit', label: 'CREDIT', icon: 'book' },
  ];

  const handleSelect = (tab: CustomersSubTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onTabPress(tab);
  };

  return (
    <View
      style={{ bottom: bottomOffset }}
      className="absolute left-4 right-4 bg-paper-50 rounded-full p-1.5 flex-row items-center justify-between shadow-lg border border-paper-200 z-40"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => handleSelect(tab.key)}
            activeOpacity={0.8}
            className={`flex-1 py-2 px-3 rounded-full flex-row items-center justify-center ${
              isActive
                ? 'bg-cinnamon-100/60 border border-cinnamon-200'
                : 'bg-transparent'
            }`}
          >
            <FontAwesome
              name={tab.icon}
              size={15}
              color={isActive ? '#E85A1F' : '#6B7280'}
              style={{ marginRight: 6 }}
            />
            <StyledText
              variant={isActive ? 'extrabold' : 'semibold'}
              className={`text-xs ${
                isActive ? 'text-cinnamon-600' : 'text-ink-500'
              }`}
            >
              {tab.label}
            </StyledText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
