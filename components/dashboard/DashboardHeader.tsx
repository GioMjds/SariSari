import React from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export type HomeSubTab = 'overview' | 'today' | 'alerts';

export interface DashboardHeaderProps {
  storeName?: string;
  branchName?: string;
  syncStatus?: 'synced' | 'syncing' | 'unsynced';
  unsyncedCount?: number;
  isOnline?: boolean;
  activeTab: HomeSubTab;
  alertCount?: number;
  onTabPress: (tab: HomeSubTab) => void;
  onSettingsPress: () => void;
}

interface Tabs {
  key: HomeSubTab;
  label: string;
}

export function DashboardHeader({
  storeName = 'SariSari Store',
  branchName = 'Main Branch',
  syncStatus = 'synced',
  unsyncedCount = 0,
  isOnline = true,
  activeTab,
  alertCount = 0,
  onTabPress,
  onSettingsPress,
}: DashboardHeaderProps) {
  const tabs: Tabs[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'today', label: 'Today' },
    { key: 'alerts', label: 'Alerts' },
  ];

  return (
    <View className="bg-cinnamon-500 px-4 pt-3 pb-2 border-b border-cinnamon-600">
      {/* Top Bar: Store info + Badges + Settings button */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1 mr-2">
          <StyledText
            variant="extrabold"
            className="text-paper-50 text-xl"
            numberOfLines={1}
          >
            {storeName}
          </StyledText>
          <StyledText variant="regular" className="text-cinnamon-200 text-xs">
            {branchName}
          </StyledText>
        </View>

        {/* Status Badges */}
        <View className="flex-row items-center gap-2">
          {/* Sync Status Badge */}
          <View className="bg-cinnamon-600 px-2 py-1 rounded-full flex-row items-center">
            <View
              className={`w-2 h-2 rounded-full mr-1.5 ${
                syncStatus === 'synced'
                  ? 'bg-emerald-400'
                  : syncStatus === 'syncing'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
              }`}
            />
            <StyledText variant="regular" className="text-paper-50 text-[10px]">
              {syncStatus === 'synced'
                ? 'Synced'
                : syncStatus === 'syncing'
                  ? 'Syncing...'
                  : `${unsyncedCount} Unsynced`}
            </StyledText>
          </View>

          {/* Network Badge */}
          <View className="bg-cinnamon-600 px-2 py-1 rounded-full flex-row items-center">
            <View
              className={`w-2 h-2 rounded-full mr-1.5 ${
                isOnline ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <StyledText variant="regular" className="text-paper-50 text-[10px]">
              {isOnline ? 'Online' : 'Offline'}
            </StyledText>
          </View>

          {/* Settings Button */}
          <Pressable
            onPress={onSettingsPress}
            hitSlop={8}
            className="w-9 h-9 rounded-full bg-cinnamon-600 items-center justify-center"
          >
            <FontAwesome5 name="cog" size={16} color="#FAF7F2" />
          </Pressable>
        </View>
      </View>

      {/* Sub-Tab Switcher Bar */}
      <View className="flex-row bg-cinnamon-600/60 p-1 rounded-xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              className={`flex-1 py-2 rounded-lg flex-row items-center justify-center ${
                isActive ? 'bg-paper-50 shadow-sm' : ''
              }`}
            >
              <StyledText
                variant={isActive ? 'extrabold' : 'medium'}
                className={`text-sm ${isActive ? 'text-cinnamon-600' : 'text-paper-200'}`}
              >
                {tab.label}
              </StyledText>
              {tab.key === 'alerts' && alertCount > 0 && (
                <View className="ml-1.5 bg-rose-500 rounded-full px-1.5 py-0.5">
                  <StyledText
                    variant="extrabold"
                    className="text-paper-50 text-[10px]"
                  >
                    {alertCount}
                  </StyledText>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
