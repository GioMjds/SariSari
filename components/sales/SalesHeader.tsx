import React from 'react';
import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { SubTabControl, SubTabItem } from '@/components/navigation';
import { formatPesos } from '@/lib';

export type SalesSubTab = 'pos' | 'cart' | 'checkout' | 'receipts';

export interface SalesHeaderProps {
  activeTab: SalesSubTab;
  todayTotal?: number;
  onTabPress: (tab: SalesSubTab) => void;
}

export function SalesHeader({
  activeTab,
  todayTotal = 0,
  onTabPress,
}: SalesHeaderProps) {
  const tabs = [
    { key: 'pos', label: 'POS', icon: 'shopping-cart' },
    { key: 'receipts', label: 'RECEIPTS', icon: 'list-alt' },
  ] satisfies SubTabItem<SalesSubTab>[];

  return (
    <View className="bg-paper-200 px-4 pt-1 pb-1">
      <SubTabControl
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={onTabPress}
        containerClassName="mb-3"
      />

      <View className="bg-cinnamon-500 rounded-3xl p-5 mb-3 shadow-md relative overflow-hidden">
        <View className="absolute -right-4 -bottom-4 opacity-20">
          <FontAwesome name="shopping-cart" size={130} color="#FFFFFF" />
        </View>

        <View className="flex-row items-center mb-2">
          <FontAwesome
            name="calendar"
            size={13}
            color="#FFFFFF"
            style={{ opacity: 0.9, marginRight: 6 }}
          />
          <StyledText
            variant="extrabold"
            className="text-white/90 text-[11px] tracking-wider uppercase"
          >
            TODAY&apos;S SALES
          </StyledText>
        </View>

        <View className="flex-row items-baseline mb-3">
          <StyledText
            variant="extrabold"
            className="text-white/90 text-2xl mr-1"
          >
            ₱
          </StyledText>
          <StyledText
            variant="extrabold"
            className="text-white text-4xl tracking-tight"
          >
            {formatPesos(todayTotal).replace('₱', '')}
          </StyledText>
        </View>
      </View>
    </View>
  );
}
