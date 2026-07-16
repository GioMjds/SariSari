import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Product } from '@/types';
import { InventoryEventType } from '@/types/inventory.types';
import { ReceiptBottomSheet } from './ReceiptBottomSheet';

interface ProductActionSheetProps {
  product: Product | null;
  onClose: () => void;
  onSelectAction: (type: InventoryEventType) => void;
  onSelectDelete: () => void;
}

export function ProductActionSheet({
  product,
  onClose,
  onSelectAction,
  onSelectDelete,
}: ProductActionSheetProps) {
  const { t } = useTranslation('inventory');
  const router = useRouter();

  if (!product) return null;

  return (
    <ReceiptBottomSheet visible={!!product} onRequestClose={onClose}>
      <View className="px-6 pt-2 pb-10">
        <View className="items-center mb-4">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-lg text-center"
          >
            {product.name}
          </StyledText>
          <StyledText
            variant="regular"
            className="text-ink-500 text-xs text-center mt-1"
          >
            {t('actionSheetSubtitle')}
          </StyledText>
        </View>

        <View className="gap-2">
          {/* Action: Mark Damaged */}
          <TouchableOpacity
            onPress={() => {
              onClose();
              onSelectAction('damaged');
            }}
            className="flex-row items-center py-4 px-4 bg-paper-100 rounded-xl border border-ink-200 active:scale-[0.98] transition-transform active:opacity-85"
          >
            <FontAwesome
              name="ban"
              size={18}
              color="#C13030"
              className="mr-3 w-6 text-center"
            />
            <StyledText variant="semibold" className="text-ink-800 text-base">
              {t('actionMarkDamaged')}
            </StyledText>
          </TouchableOpacity>

          {/* Action: Adjust Stock */}
          <TouchableOpacity
            onPress={() => {
              onClose();
              onSelectAction('adjustment');
            }}
            className="flex-row items-center py-4 px-4 bg-paper-100 rounded-xl border border-ink-200 active:scale-[0.98] transition-transform active:opacity-85"
          >
            <FontAwesome
              name="sliders"
              size={18}
              color="#4A2610"
              className="mr-3 w-6 text-center"
            />
            <StyledText variant="semibold" className="text-ink-800 text-base">
              {t('actionAdjustStock')}
            </StyledText>
          </TouchableOpacity>

          {/* Action: View Ledger */}
          <TouchableOpacity
            onPress={() => {
              onClose();
              router.push(`/(edit-forms)/inventory-ledger/${product.id}` as any);
            }}
            className="flex-row items-center py-4 px-4 bg-paper-100 rounded-xl border border-ink-200 active:scale-[0.98] transition-transform active:opacity-85"
          >
            <FontAwesome
              name="list-alt"
              size={18}
              color="#E85A1F"
              className="mr-3 w-6 text-center"
            />
            <StyledText variant="semibold" className="text-ink-800 text-base">
              {t('actionViewLedger')}
            </StyledText>
          </TouchableOpacity>

          {/* Divider */}
          <View className="h-[1px] bg-ink-200 my-2" />

          {/* Action: Edit Product */}
          <TouchableOpacity
            onPress={() => {
              onClose();
              router.push(`/(edit-forms)/edit-product/${product.id}` as any);
            }}
            className="flex-row items-center py-4 px-4 bg-paper-100 rounded-xl border border-ink-200 active:scale-[0.98] transition-transform active:opacity-85"
          >
            <FontAwesome
              name="pencil"
              size={18}
              color="#E85A1F"
              className="mr-3 w-6 text-center"
            />
            <StyledText
              variant="extrabold"
              className="text-cinnamon-500 text-base"
            >
              {t('actionEditProduct')}
            </StyledText>
          </TouchableOpacity>

          {/* Action: Delete Product */}
          <TouchableOpacity
            onPress={() => {
              onClose();
              onSelectDelete();
            }}
            className="flex-row items-center py-4 px-4 bg-semantic-danger-50 rounded-xl border border-semantic-danger-100 active:scale-[0.98] transition-transform active:opacity-85"
          >
            <FontAwesome
              name="trash"
              size={18}
              color="#C13030"
              className="mr-3 w-6 text-center"
            />
            <StyledText
              variant="extrabold"
              className="text-semantic-danger text-base"
            >
              {t('actionDeleteProduct')}
            </StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </ReceiptBottomSheet>
  );
}
