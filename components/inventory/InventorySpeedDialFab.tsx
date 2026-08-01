import React, { useState } from 'react';
import { View, TouchableOpacity, Pressable } from 'react-native';
import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';

export interface InventorySpeedDialFabProps {
  onAddProduct: () => void;
  onReceiveStock: () => void;
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

  const actions = [
    {
      id: 'add_product',
      label: 'Add Product',
      icon: 'plus' as const,
      onPress: () => {
        setExpanded(false);
        onAddProduct();
      },
    },
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
    <View className="absolute bottom-6 right-6 items-end z-50">
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
              <View className="w-10 h-10 rounded-full bg-persimmon-500 items-center justify-center shadow-lg">
                <FontAwesome name={action.icon} size={16} color="#FAFAF7" />
              </View>
            </TouchableOpacity>
          ))}
        </MotiView>
      )}

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityLabel={
          expanded ? 'Close inventory quick actions' : 'Inventory Quick Actions'
        }
        accessibilityState={{ expanded }}
        className="w-14 h-14 rounded-full bg-persimmon-500 items-center justify-center shadow-xl active:scale-95"
      >
        <FontAwesome
          name={expanded ? 'close' : 'plus'}
          size={22}
          color="#FAFAF7"
        />
      </TouchableOpacity>
    </View>
  );
}
