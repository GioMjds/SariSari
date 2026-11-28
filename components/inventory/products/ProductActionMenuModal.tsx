import { memo, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui/MoneyText';
import { Sheet } from '@/components/ui/Sheet';
import {
  SheetActionGroup,
  SheetActionRow,
  SheetDeleteAction,
} from '@/components/ui/SheetActions';
import { ProductStatusChip } from '@/components/inventory/ProductStatusChip';
import { getProductImageUri } from '@/lib';
import { useNearExpiryDays } from '@/hooks/useAppSetting';
import { daysUntilProductExpiry, getStatus } from '@/types/inventory.types';
import type { Product } from '@/types/products.types';
import { useStocktakeGuard } from '@/hooks/useStocktake';

export interface ProductActionMenuModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onEdit: (id: number) => void;
  onAdjustStock: (id: number) => void;
  onMarkDamaged: (id: number) => void;
  onViewLedger: (id: number) => void;
  onDelete: (id: number) => void;
}

type IconName = keyof typeof FontAwesome.glyphMap;

export function ProductActionMenuModal({
  visible,
  product,
  onClose,
  onEdit,
  onAdjustStock,
  onMarkDamaged,
  onViewLedger,
  onDelete,
}: ProductActionMenuModalProps) {
  const { isActive: stocktakeActive } = useStocktakeGuard();
  // Keep the last product so the sheet still has content while it slides out.
  const [shown, setShown] = useState(product);

  useEffect(() => {
    if (product) setShown(product);
  }, [product]);

  const run = (action: (id: number) => void, guarded = false) => () => {
    if (!shown || guarded) return;
    onClose();
    action(shown.id);
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      {shown ? (
        <>
          <ProductHeader product={shown} onClose={onClose} />

          {stocktakeActive ? (
            <View
              accessibilityRole="alert"
              className="flex-row items-center gap-x-3 px-3 py-2.5 rounded-xl bg-semantic-warning-50 border border-semantic-warning-100"
            >
              <FontAwesome name="lock" size={14} color="#A35F00" />
              <StyledText
                variant="medium"
                className="flex-1 text-caption text-ink-800"
              >
                Stocktake in progress. Stock changes are paused until the count
                is finished.
              </StyledText>
            </View>
          ) : null}

          <View className="flex-row gap-x-3">
            <ActionTile
              icon="sliders"
              label="Adjust stock"
              hint={stocktakeActive ? 'Paused' : 'Correct the count'}
              chip="bg-cinnamon-50"
              iconColor="#623418"
              disabled={stocktakeActive}
              onPress={run(onAdjustStock, stocktakeActive)}
            />
            <ActionTile
              icon="ban"
              label="Mark damaged"
              hint={stocktakeActive ? 'Paused' : 'Spoiled or broken'}
              chip="bg-semantic-danger-50"
              iconColor="#C13030"
              disabled={stocktakeActive}
              onPress={run(onMarkDamaged, stocktakeActive)}
            />
          </View>

          <SheetActionGroup>
            <SheetActionRow
              icon="book"
              label="View ledger"
              hint="Every stock movement"
              onPress={run(onViewLedger)}
            />
            <SheetActionRow
              icon="pencil"
              label="Edit product"
              hint="Name, price, units and photo"
              iconColor="#E85A1F"
              onPress={run(onEdit)}
            />
          </SheetActionGroup>

          <SheetDeleteAction
            label="Delete product"
            prompt={`Remove ${shown.name} from your catalog?`}
            onConfirm={run(onDelete)}
          />
        </>
      ) : null}
    </Sheet>
  );
}

const ProductHeader = memo(function ProductHeader({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const windowDays = useNearExpiryDays();
  const imageUri = getProductImageUri(product.image_uri);
  const initial = product.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View className="flex-row items-start gap-x-3 pb-4 border-b border-dashed border-paper-400">
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={150}
          className="w-14 h-14 rounded-xl bg-paper-100"
        />
      ) : (
        <View className="w-14 h-14 rounded-xl bg-persimmon-50 border border-persimmon-100 items-center justify-center">
          <StyledText variant="black" className="text-persimmon-600 text-h2">
            {initial}
          </StyledText>
        </View>
      )}

      <View className="flex-1 min-w-0">
        <StyledText
          variant="extrabold"
          accessibilityRole="header"
          numberOfLines={2}
          className="text-h3 text-ink-900"
        >
          {product.name}
        </StyledText>
        <StyledText
          variant="medium"
          numberOfLines={1}
          className="text-caption text-ink-500 mt-0.5"
        >
          {product.category ?? 'Uncategorized'} ·{' '}
          {product.retail_unit_name ?? 'Pc'}
        </StyledText>
        <View className="flex-row items-center flex-wrap gap-2 mt-2">
          <MoneyText value={product.price ?? 0} size="md" className="text-ink-900" />
          <ProductStatusChip
            status={getStatus(product as any, Date.now(), windowDays)}
            expiryDays={daysUntilProductExpiry(product)}
          />
          <StyledText
            variant="medium"
            className="text-caption text-ink-500"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {product.quantity} on hand
          </StyledText>
        </View>
      </View>

      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={`Close actions for ${product.name}`}
        hitSlop={4}
        className="w-10 h-10 -mr-2 -mt-1 rounded-pill items-center justify-center active:bg-paper-100"
      >
        <FontAwesome name="times" size={16} color="#564E45" />
      </Pressable>
    </View>
  );
});

interface ActionTileProps {
  icon: IconName;
  label: string;
  hint: string;
  chip: string;
  iconColor: string;
  disabled: boolean;
  onPress: () => void;
}

const ActionTile = memo(function ActionTile({
  icon,
  label,
  hint,
  chip,
  iconColor,
  disabled,
  onPress,
}: ActionTileProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
      style={disabled ? { opacity: 0.5 } : undefined}
      className="flex-1 min-h-[104px] p-3 rounded-xl border border-paper-300 bg-paper-100 justify-between active:bg-paper-200 press-scale"
    >
      <View className={`w-10 h-10 rounded-lg items-center justify-center ${chip}`}>
        <FontAwesome name={disabled ? 'lock' : icon} size={16} color={iconColor} />
      </View>
      <View className="mt-3">
        <StyledText variant="extrabold" className="text-[15px] text-ink-900">
          {label}
        </StyledText>
        <StyledText variant="regular" className="text-caption text-ink-500 mt-0.5">
          {hint}
        </StyledText>
      </View>
    </Pressable>
  );
});
