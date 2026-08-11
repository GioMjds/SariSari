import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SharedValue } from 'react-native-reanimated';
import { StyledText } from '@/components/elements';
import { SubTabControl, SubTabItem } from '@/components/navigation';
import { CustomersSubTab } from '@/constants/tabs';
import { formatPesos } from '@/lib';

export type { CustomersSubTab };

export interface CustomersHeaderProps {
  activeTab: CustomersSubTab;
  totalCustomers?: number;
  debtorCount?: number;
  loyalCount?: number;
  totalCredit?: number;
  onTabPress: (tab: CustomersSubTab) => void;
  onAddCustomer?: () => void;
  progress?: SharedValue<number>;
}

export function CustomersHeader({
  activeTab,
  totalCustomers = 142,
  debtorCount = 0,
  loyalCount = 28,
  totalCredit = 4850,
  onTabPress,
  progress,
}: CustomersHeaderProps) {
  const tabs: SubTabItem<CustomersSubTab>[] = [
    { key: 'all', label: 'ALL' },
    { key: 'credit', label: 'CREDIT', badgeCount: debtorCount },
  ];

  return (
    <View className="bg-paper-200 px-4 pt-1 pb-1">
      {/* Top Segmented Sub-Tab Navigation Control */}
      <SubTabControl
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={onTabPress}
        containerClassName="mb-3"
        {...(progress ? { progress } : {})}
      />

      {/* Hero Card: Total Outstanding Credit */}
      <View className="bg-cinnamon-500 rounded-3xl p-5 mb-3 shadow-md relative overflow-hidden">
        {/* Background Watermark Wallet Icon */}
        <View className="absolute -right-4 -bottom-4 opacity-20">
          <FontAwesome name="credit-card" size={130} color="#FFFFFF" />
        </View>

        {/* Top Header Row in Card */}
        <View className="flex-row items-center mb-2">
          <FontAwesome
            name="briefcase"
            size={13}
            color="#FFFFFF"
            style={{ opacity: 0.9, marginRight: 6 }}
          />
          <StyledText
            variant="extrabold"
            className="text-white/90 text-[11px] tracking-wider uppercase"
          >
            TOTAL OUTSTANDING CREDIT
          </StyledText>
        </View>

        {/* Main Amount */}
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
            {formatPesos(totalCredit).replace('₱', '')}
          </StyledText>
        </View>

        {/* Dynamic Badge Pill */}
        <View className="self-start bg-white/25 px-3 py-1 rounded-full flex-row items-center">
          <FontAwesome
            name="arrow-up"
            size={10}
            color="#FFFFFF"
            style={{ marginRight: 4 }}
          />
          <StyledText variant="extrabold" className="text-white text-xs">
            +₱320 this week
          </StyledText>
        </View>
      </View>

      {/* KPI Summary Cards Grid */}
      <View className="flex-row gap-3 mb-1">
        {/* Customers Stat Card */}
        <View className="flex-1 bg-paper-100 rounded-2xl p-3.5 border border-paper-200 shadow-sm">
          <View className="w-8 h-8 rounded-full bg-cinnamon-100 items-center justify-center mb-2">
            <FontAwesome name="users" size={14} color="#E85A1F" />
          </View>
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-2xl mb-0.5"
          >
            {totalCustomers}
          </StyledText>
          <StyledText
            variant="extrabold"
            className="text-ink-400 text-[10px] tracking-wider uppercase"
          >
            CUSTOMERS
          </StyledText>
        </View>

        {/* Loyal VIPs Stat Card */}
        <View className="flex-1 bg-paper-100 rounded-2xl p-3.5 border border-paper-200 shadow-sm">
          <View className="w-8 h-8 rounded-full bg-amber-100 items-center justify-center mb-2">
            <FontAwesome name="star" size={14} color="#D97706" />
          </View>
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-2xl mb-0.5"
          >
            {loyalCount}
          </StyledText>
          <StyledText
            variant="extrabold"
            className="text-ink-400 text-[10px] tracking-wider uppercase"
          >
            LOYAL VIPS
          </StyledText>
        </View>
      </View>
    </View>
  );
}
