import React from 'react';
import { View, Pressable, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { FinancialReceipt } from '@/database/receipts';

interface Props {
  receipts: FinancialReceipt[];
  onAddReceipt: (uri: string) => Promise<void>;
  onDeleteReceipt: (id: string) => Promise<void>;
}

export const ReceiptPicker: React.FC<Props> = ({
  receipts,
  onAddReceipt,
  onDeleteReceipt,
}) => {
  const handlePickImage = async () => {
    if (receipts.length >= 5) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await onAddReceipt(result.assets[0].uri);
    }
  };

  return (
    <View className="mb-4">
      <StyledText variant="semibold" className="text-sm text-ink-700 mb-2">
        Receipts ({receipts.length}/5)
      </StyledText>
      <View className="flex-row flex-wrap gap-2">
        {receipts.map((r) => (
          <View
            key={r.id}
            className="relative w-16 h-16 rounded-xl overflow-hidden border border-paper-300"
          >
            <Image source={{ uri: r.relativePath }} className="w-full h-full" />
            <Pressable
              onPress={() => onDeleteReceipt(r.id)}
              accessibilityRole="button"
              accessibilityLabel="Remove receipt"
              hitSlop={8}
              className="absolute top-0.5 right-0.5 bg-ink-900/70 rounded-full w-6 h-6 items-center justify-center"
            >
              <FontAwesome name="times" size={12} color="#FAFAF7" />
            </Pressable>
          </View>
        ))}

        {receipts.length < 5 && (
          <Pressable
            onPress={handlePickImage}
            accessibilityRole="button"
            accessibilityLabel="Add receipt photo"
            className="w-16 h-16 rounded-xl border border-dashed border-ink-300 items-center justify-center bg-paper-100 active:opacity-70"
          >
            <FontAwesome name="camera" size={16} color="#564E45" />
            <StyledText variant="medium" className="text-xs text-ink-600 mt-1">
              Add
            </StyledText>
          </Pressable>
        )}
      </View>
    </View>
  );
};
