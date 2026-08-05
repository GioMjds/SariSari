import React, { useState } from 'react';
import { View, TouchableOpacity, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';

export interface InventorySpeedDialFabProps {
  onAddProduct: () => void;
  onReceiveStock: () => void;
  onMarkDamaged?: () => void;
  onStockAdjustment: () => void;
  onScanBarcode: () => void;
}

export function InventorySpeedDialFab({
  onAddProduct,
  onReceiveStock,
  onStockAdjustment,
  onScanBarcode,
}: InventorySpeedDialFabProps) {
  const [expanded, setExpanded] = useState(false);
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(24, insets.bottom + 16);

  const actions = [
    {
      id: 'receive_stock',
      label: 'Receive Stock',
      icon: 'download' as const,
      onPress: () => {
        setExpanded(false);
        onReceiveStock();
      },
    },
    {
      id: 'stock_adjustment',
      label: 'Stock Adjustment',
      icon: 'sliders' as const,
      onPress: () => {
        setExpanded(false);
        onStockAdjustment();
      },
    },
    {
      id: 'scan_barcode',
      label: 'Scan Barcode',
      icon: 'barcode' as const,
      onPress: () => {
        setExpanded(false);
        onScanBarcode();
      },
    },
  ] as const;

  return (
    <View
      className="absolute right-5 items-end z-50"
      style={{ bottom: bottomOffset }}
    >
      {expanded && (
        <Pressable
          onPress={() => setExpanded(false)}
          className="absolute -top-[1000px] -left-[1000px] -right-[1000px] -bottom-[1000px] bg-ink-900/40"
        />
      )}

      {expanded && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 200 }}
          className="mb-3 items-end gap-y-3"
        >
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              activeOpacity={0.8}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              className="flex-row items-center gap-x-3"
            >
              <View className="bg-ink-900 px-3 py-1.5 rounded-lg shadow-md border border-ink-700">
                <StyledText variant="extrabold" className="text-paper-50 text-xs">
                  {action.label}
                </StyledText>
              </View>
              <View className="w-10 h-10 rounded-full bg-cinnamon-500 items-center justify-center shadow-lg">
                <FontAwesome name={action.icon} size={16} color="#FAFAF7" />
              </View>
            </TouchableOpacity>
          ))}
        </MotiView>
      )}

      <View className="flex-row items-center gap-x-2">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setExpanded(!expanded)}
          accessibilityRole="button"
          accessibilityLabel={
            expanded ? 'Close extra quick actions' : 'More quick actions'
          }
          accessibilityState={{ expanded }}
          className="w-11 h-11 rounded-full bg-ink-900 items-center justify-center shadow-lg border border-ink-700 active:scale-95"
        >
          <FontAwesome
            name={expanded ? 'close' : 'ellipsis-v'}
            size={16}
            color="#FAFAF7"
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onAddProduct}
          accessibilityRole="button"
          accessibilityLabel="Add New Product"
          className="h-14 px-5 rounded-full bg-persimmon-500 flex-row items-center justify-center shadow-xl active:scale-95 gap-x-2 border border-persimmon-400"
        >
          <FontAwesome name="plus" size={18} color="#FAFAF7" />
          <StyledText variant="extrabold" className="text-paper-50 text-sm">
            Add Product
          </StyledText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
