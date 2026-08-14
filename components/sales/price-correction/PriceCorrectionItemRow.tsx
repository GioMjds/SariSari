import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { formatPesos, tryParsePesosInput } from '@/lib/money';

type PriceCorrectionItemRowProps = {
  item: {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
  };
  editValue: string | undefined;
  onChangeEdit: (saleItemId: number, value: string) => void;
  onResetItem: (saleItemId: number) => void;
};

const INPUT_CONTAINER_INVALID =
  'flex-row items-center gap-1 bg-paper-50 border rounded-xl px-2.5 py-1 border-semantic-danger bg-semantic-danger-50';
const INPUT_CONTAINER_CHANGED =
  'flex-row items-center gap-1 bg-paper-50 border rounded-xl px-2.5 py-1 border-cinnamon-500 bg-cinnamon-50/40';
const INPUT_CONTAINER_FOCUSED =
  'flex-row items-center gap-1 bg-paper-50 border rounded-xl px-2.5 py-1 border-persimmon-500';
const INPUT_CONTAINER_DEFAULT =
  'flex-row items-center gap-1 bg-paper-50 border rounded-xl px-2.5 py-1 border-ink-200';

export const PriceCorrectionItemRow: React.FC<PriceCorrectionItemRowProps> = ({
  item,
  editValue = '',
  onChangeEdit,
  onResetItem,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasEdited = editValue !== undefined && editValue.trim() !== '';
  const parsedNewPrice = hasEdited ? tryParsePesosInput(editValue) : item.price;
  const isPriceChanged = hasEdited && parsedNewPrice !== item.price;
  const isInvalid = hasEdited && !(parsedNewPrice > 0);

  const origLineTotal = item.price * item.quantity;
  const newLineTotal = parsedNewPrice * item.quantity;
  const itemDelta = newLineTotal - origLineTotal;

  const inputContainerClass = isInvalid
    ? INPUT_CONTAINER_INVALID
    : isPriceChanged
      ? INPUT_CONTAINER_CHANGED
      : isFocused
        ? INPUT_CONTAINER_FOCUSED
        : INPUT_CONTAINER_DEFAULT;

  return (
    <View className="bg-paper-100/70 p-3 rounded-xl border border-ink-100 gap-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3 flex-row items-center gap-2">
          <View className="bg-paper-200 px-2 py-0.5 rounded-md border border-ink-100">
            <StyledText variant="extrabold" className="text-ink-900 text-xs">
              {item.quantity}x
            </StyledText>
          </View>
          <View className="flex-1">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-xs"
              numberOfLines={1}
            >
              {item.product_name}
            </StyledText>
            <StyledText variant="regular" className="text-ink-500 text-[11px] mt-0.5">
              Orig unit price: {formatPesos(item.price)}
            </StyledText>
          </View>
        </View>

        {/* Input Field */}
        <View className="flex-row items-center gap-1.5">
          {hasEdited && (
            <Pressable
              onPress={() => onResetItem(item.id)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={`Reset price for ${item.product_name}`}
              className="w-6 h-6 rounded-full bg-paper-200 border border-ink-100 items-center justify-center active:opacity-70"
            >
              <FontAwesome name="times" size={10} color="#7A7165" />
            </Pressable>
          )}

          <View className={inputContainerClass}>
            <StyledText variant="semibold" className="text-ink-600 text-sm">
              ₱
            </StyledText>
            <TextInput
              value={editValue}
              onChangeText={(val) => onChangeEdit(item.id, val)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={(item.price / 100).toString()}
              placeholderTextColor="#A89F90"
              keyboardType="decimal-pad"
              selectTextOnFocus
              accessibilityLabel={`New unit price for ${item.product_name}`}
              className="text-ink-900 text-sm font-bold w-20 text-right py-0.5"
            />
          </View>
        </View>
      </View>

      {/* Comparison Delta Badge */}
      {isPriceChanged && (
        <View className="flex-row items-center justify-between pt-2 border-t border-ink-100">
          <StyledText variant="medium" className="text-ink-500 text-xs">
            Line Total: {formatPesos(origLineTotal)}{' '}
            →{' '}
            <StyledText variant="extrabold" className="text-ink-900">
              {formatPesos(newLineTotal)}
            </StyledText>
          </StyledText>
          <View
            className={`px-2 py-0.5 rounded-md ${
              itemDelta < 0 ? 'bg-emerald-100' : 'bg-amber-100'
            }`}
          >
            <StyledText
              variant="extrabold"
              className={`text-[11px] ${
                itemDelta < 0 ? 'text-emerald-800' : 'text-amber-800'
              }`}
            >
              {itemDelta > 0 ? '+' : ''}
              {formatPesos(itemDelta)}
            </StyledText>
          </View>
        </View>
      )}
    </View>
  );
};
