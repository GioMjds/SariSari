import { useEffect, useMemo, useState } from 'react';
import { Pressable, TextInput, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/inventory/modals/_shared';
import { parsePesosInput } from '@/lib/money';
import type { QuickAddProductInput } from '@/types/deliveries.types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (p: QuickAddProductInput) => void;
  /** Prefill from a scanned barcode or catalog match. */
  initialName?: string;
  initialBarcode?: string;
}

// Whole pesos above 0, or null. A blank price is never treated as 0.
const parsePrice = (raw: string): number | null => {
  if (raw.trim() === '') return null;
  try {
    const n = Math.round(Number(parsePesosInput(raw)));
    return n > 0 ? n : null;
  } catch {
    return null;
  }
};

export function QuickAddProductSheet({
  visible,
  onClose,
  onSubmit,
  initialName,
  initialBarcode,
}: Props) {
  const { t } = useTranslation('receiving');
  const [name, setName] = useState('');
  const [priceText, setPriceText] = useState('');
  const [barcode, setBarcode] = useState('');

  // Reset when the sheet re-opens.
  useEffect(() => {
    if (visible) {
      setName(initialName ?? '');
      setPriceText('');
      setBarcode(initialBarcode ?? '');
    }
  }, [visible, initialName, initialBarcode]);

  const price = useMemo(() => parsePrice(priceText), [priceText]);
  const priceInvalid = priceText.trim() !== '' && price === null;
  const valid = name.trim() !== '' && price !== null;

  const handleSubmit = () => {
    if (!valid || price === null) return;
    onSubmit({ name: name.trim(), price, barcode: barcode.trim() || null });
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="flex-row items-center justify-between">
        <StyledText variant="black" className="text-ink-900 text-base">
          {t('quickAddTitle')}
        </StyledText>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('cancel')}
          className="w-9 h-9 rounded-full items-center justify-center active:bg-paper-100"
        >
          <FontAwesome name="times" size={14} color="#0E0C0A" />
        </Pressable>
      </View>

      <View className="gap-y-1">
        <StyledText variant="regular" className="text-ink-500 text-xs">
          {t('quickAddName')}
        </StyledText>
        <TextInput
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          accessibilityLabel={t('quickAddName')}
          className="bg-paper-100 border border-paper-300 rounded-xl px-3 py-3 text-ink-900"
        />
      </View>

      <View className="gap-y-1">
        <StyledText variant="regular" className="text-ink-500 text-xs">
          {t('quickAddPrice')}
        </StyledText>
        <TextInput
          value={priceText}
          onChangeText={setPriceText}
          keyboardType="decimal-pad"
          accessibilityLabel={t('quickAddPrice')}
          className={`bg-paper-100 border rounded-xl px-3 py-3 text-ink-900 ${
            priceInvalid ? 'border-semantic-danger' : 'border-paper-300'
          }`}
        />
        {priceInvalid ? (
          <StyledText
            variant="medium"
            className="text-semantic-danger text-xs mt-1 px-1"
            accessibilityRole="alert"
          >
            {t('quickAddPriceInvalid')}
          </StyledText>
        ) : null}
      </View>

      <View className="gap-y-1">
        <StyledText variant="regular" className="text-ink-500 text-xs">
          {t('quickAddBarcode')}
        </StyledText>
        <TextInput
          value={barcode}
          onChangeText={setBarcode}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={t('quickAddBarcode')}
          className="bg-paper-100 border border-paper-300 rounded-xl px-3 py-3 text-ink-900"
        />
      </View>

      <View className="flex-row gap-x-3 mt-2">
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('cancel')}
          className="flex-1 min-h-[44px] rounded-xl items-center justify-center border border-ink-200 bg-paper-100"
        >
          <StyledText variant="extrabold" className="text-ink-700 text-sm">
            {t('cancel')}
          </StyledText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!valid}
          accessibilityRole="button"
          accessibilityLabel={t('quickAddSubmit')}
          accessibilityState={{ disabled: !valid }}
          className={`flex-1 min-h-[44px] rounded-xl items-center justify-center ${
            valid ? 'bg-persimmon-500' : 'bg-paper-300'
          }`}
        >
          <StyledText variant="extrabold" className="text-paper-50 text-sm">
            {t('quickAddSubmit')}
          </StyledText>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}
