import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTabBarBottomOffset } from '@/components/layout';

export interface InventorySpeedDialFabProps {
  onAddProduct: () => void;
  onReceiveStock: () => void;
  onMarkDamaged: () => void;
  onStockAdjustment: () => void;
  onScanBarcode: () => void;
}

export function InventorySpeedDialFab({
  onAddProduct,
  onReceiveStock,
  onMarkDamaged,
  onStockAdjustment,
  onScanBarcode,
}: InventorySpeedDialFabProps) {
  const [expanded, setExpanded] = useState(false);
  const tabBarBottomOffset = useTabBarBottomOffset();
  const bottomOffset = tabBarBottomOffset + 16;

  const actions = [
    {
      id: 'add_product',
      label: 'Add Product',
      icon: 'plus' as const,
      isPrimary: true,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        setExpanded(false);
        onAddProduct();
      },
    },
    {
      id: 'receive_stock',
      label: 'Receive Stock',
      icon: 'download' as const,
      isPrimary: false,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setExpanded(false);
        onReceiveStock();
      },
    },
    {
      id: 'stock_adjustment',
      label: 'Stock Adjustment',
      icon: 'sliders' as const,
      isPrimary: false,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setExpanded(false);
        onStockAdjustment();
      },
    },
    {
      id: 'mark_damaged',
      label: 'Mark Damaged',
      icon: 'ban' as const,
      isPrimary: false,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setExpanded(false);
        onMarkDamaged();
      },
    },
    {
      id: 'scan_barcode',
      label: 'Scan Barcode',
      icon: 'barcode' as const,
      isPrimary: false,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setExpanded(false);
        onScanBarcode();
      },
    },
  ] as const;

  const handleToggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExpanded((prev) => !prev);
  };

  return (
    <>
      {/* Collapsed FAB Trigger Button */}
      <View
        className="absolute right-5 items-end z-50"
        style={{ bottom: bottomOffset }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleToggleExpand}
          accessibilityRole="button"
          accessibilityLabel="Inventory actions menu"
          accessibilityState={{ expanded: false }}
          className="w-16 h-16 rounded-full bg-persimmon-500 items-center justify-center shadow-xl border border-persimmon-400 active:scale-95"
        >
          <FontAwesome name="ellipsis-v" size={20} color="#FAFAF7" />
        </TouchableOpacity>
      </View>

      {/* Expanded Speed Dial Modal Backdrop & Menu */}
      <Modal
        visible={expanded}
        transparent
        animationType="fade"
        onRequestClose={() => setExpanded(false)}
      >
        <View style={StyleSheet.absoluteFill} className="relative">
          {/* Backdrop overlay covering 100% of screen */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setExpanded(false)}
            className="bg-ink-900/60"
          />

          {/* Speed Dial items container floating above tab bar */}
          <View
            className="absolute right-5 items-end z-50"
            style={{ bottom: bottomOffset }}
          >
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
                  <View className="bg-ink-900 px-3.5 py-2 rounded-xl shadow-md border border-ink-700">
                    <StyledText
                      variant="extrabold"
                      className="text-paper-50 text-md"
                    >
                      {action.label}
                    </StyledText>
                  </View>

                  <View
                    className={`w-16 h-16 rounded-full items-center justify-center shadow-lg border ${
                      action.isPrimary
                        ? 'bg-persimmon-500 border-persimmon-400'
                        : 'bg-cinnamon-500 border-cinnamon-400'
                    }`}
                  >
                    <FontAwesome name={action.icon} size={20} color="#FAFAF7" />
                  </View>
                </TouchableOpacity>
              ))}
            </MotiView>

            {/* Close Toggle Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleToggleExpand}
              accessibilityRole="button"
              accessibilityLabel="Close actions menu"
              accessibilityState={{ expanded: true }}
              className="w-14 h-14 rounded-full bg-ink-900 items-center justify-center shadow-xl border border-ink-700 active:scale-95"
            >
              <FontAwesome name="close" size={20} color="#FAFAF7" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
