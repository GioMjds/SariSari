import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { sortOption, SortOption } from '@/constants';
import { ReceiptBottomSheet } from './ReceiptBottomSheet';

type SortDirection = 'asc' | 'desc';

interface SortBottomSheetProps {
  visible: boolean;
  onRequestClose: () => void;
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSort: (option: SortOption) => void;
}

export function SortBottomSheet({
  visible,
  onRequestClose,
  sortBy,
  sortDirection,
  onSort,
}: SortBottomSheetProps) {
  const { t } = useTranslation('inventory');

  return (
    <ReceiptBottomSheet visible={visible} onRequestClose={onRequestClose}>
      <View className="px-6 pt-4 pb-8">
        <View className="items-center mb-4">
          <View className="w-12 h-1 bg-ink-200 rounded-full mb-4" />
          <StyledText variant="extrabold" className="text-ink-900 text-xl">
            {t('sortBy')}
          </StyledText>
        </View>

        <View>
          {sortOption.map((option, idx) => (
            <TouchableOpacity
              key={option.key}
              hitSlop={20}
              onPress={() => onSort(option.key)}
              activeOpacity={0.7}
              className={`flex-row items-center justify-between py-4 ${
                idx < sortOption.length - 1
                  ? 'border-b border-dashed border-ink-200'
                  : ''
              }`}
            >
              <View className="flex-row items-center">
                <FontAwesome
                  name={option.icon as any}
                  size={18}
                  color="#E85A1F"
                />
                <StyledText
                  variant="medium"
                  className="text-ink-800 ml-3 text-base"
                >
                  {t(
                    `sort${
                      option.key.charAt(0).toUpperCase() + option.key.slice(1)
                    }`,
                  )}
                </StyledText>
              </View>
              {sortBy === option.key && (
                <FontAwesome
                  name={sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'}
                  size={18}
                  color="#E85A1F"
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={onRequestClose}
          hitSlop={8}
          className="bg-ink-100 rounded-xl py-3 mt-4 active:opacity-70 active:scale-[0.98] transition-transform"
        >
          <StyledText
            variant="semibold"
            className="text-ink-700 text-center text-base"
          >
            {t('common:close')}
          </StyledText>
        </TouchableOpacity>
      </View>
    </ReceiptBottomSheet>
  );
}
