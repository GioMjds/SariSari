import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useCategories, useProducts } from '@/hooks';
import { useToastStore } from '@/stores';
import type { Category } from '@/types/categories.types';

interface Props {
  visible: boolean;
  productIds: number[];
  onClose: () => void;
}

export function BulkMoveCategoryModal({ visible, productIds, onClose }: Props) {
  const { getAllCategoriesQuery } = useCategories();
  const { updateProductCategoryMutation } = useProducts();
  const addToast = useToastStore((s) => s.addToast);
  const [picked, setPicked] = useState<string>('');
  const categories = useMemo(
    () => getAllCategoriesQuery.data ?? [],
    [getAllCategoriesQuery.data],
  );

  const handleConfirm = async () => {
    if (productIds.length === 0 || picked === '') return;
    const nextCategory = picked === '__none__' ? null : picked;
    try {
      await Promise.all(
        productIds.map((id) =>
          updateProductCategoryMutation.mutateAsync({ id, category: nextCategory }),
        ),
      );
      addToast({
        message: `Moved ${productIds.length} ${
          productIds.length === 1 ? 'product' : 'products'
        } to ${nextCategory ?? 'Uncategorized'}`,
        variant: 'success',
        duration: 4000,
      });
      setPicked('');
      onClose();
    } catch {
      // mutation's onError already toasted the failure
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/50 justify-end"
      >
        <Pressable onPress={onClose} className="flex-1" />
        <MotiView
          from={{ translateY: 600 }}
          animate={{ translateY: 0 }}
          transition={{ type: 'timing', duration: 250 }}
          className="bg-paper-50 rounded-t-2xl p-5 border-t border-paper-300 gap-y-4"
        >
          <StyledText variant="extrabold" className="text-base text-ink-900">
            Move {productIds.length} product{productIds.length === 1 ? '' : 's'}{' '}
            to…
          </StyledText>

          <ScrollView className="max-h-[280px]">
            <Row
              label="Uncategorized"
              icon="circle-o"
              active={picked === '__none__'}
              onPress={() => setPicked('__none__')}
            />
            {categories.map((c: Category) => (
              <Row
                key={c.id ?? c.name}
                label={c.name}
                icon="tag"
                active={picked === c.name}
                onPress={() => setPicked(c.name)}
              />
            ))}
          </ScrollView>

          <View className="flex-row gap-x-3">
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel bulk move"
              className="flex-1 min-h-[44px] rounded-xl items-center justify-center border border-ink-200 bg-paper-100"
            >
              <StyledText variant="extrabold" className="text-ink-700 text-sm">
                Cancel
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!picked || updateProductCategoryMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Confirm bulk move"
              accessibilityState={{ disabled: !picked }}
              className={`flex-1 min-h-[44px] rounded-xl items-center justify-center ${
                picked && !updateProductCategoryMutation.isPending
                  ? 'bg-persimmon-500'
                  : 'bg-paper-300'
              }`}
            >
              <FontAwesome name="check" size={14} color="#FBF7EE" />
              <StyledText
                variant="extrabold"
                className="text-paper-50 text-sm ml-2"
              >
                Move
              </StyledText>
            </TouchableOpacity>
          </View>
        </MotiView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface RowProps {
  label: string;
  icon: 'tag' | 'circle-o';
  active: boolean;
  onPress: () => void;
}

function Row({ label, icon, active, onPress }: RowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Choose category ${label}`}
      accessibilityState={{ selected: active }}
      className={`flex-row items-center justify-between min-h-[44px] px-3 rounded-xl ${
        active ? 'bg-persimmon-50' : 'bg-paper-100'
      } mb-2`}
    >
      <View className="flex-row items-center gap-x-3">
        <FontAwesome
          name={icon}
          size={14}
          color={active ? '#E85A1F' : '#7A7165'}
        />
        <StyledText
          variant="medium"
          className={active ? 'text-persimmon-600' : 'text-ink-700'}
        >
          {label}
        </StyledText>
      </View>
      {active ? <FontAwesome name="check" size={14} color="#E85A1F" /> : null}
    </TouchableOpacity>
  );
}
