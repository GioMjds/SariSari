import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome5 } from '@expo/vector-icons';
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
      <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Receipts ({receipts.length}/5)
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {receipts.map((r) => (
          <View key={r.id} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
            <Image source={{ uri: r.relativePath }} className="w-full h-full" />
            <Pressable
              onPress={() => onDeleteReceipt(r.id)}
              className="absolute top-1 right-1 bg-black/60 rounded-full w-4 h-4 items-center justify-center"
            >
              <Text className="text-white text-[10px] font-bold">×</Text>
            </Pressable>
          </View>
        ))}

        {receipts.length < 5 && (
          <Pressable
            onPress={handlePickImage}
            className="w-16 h-16 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 items-center justify-center bg-gray-50 dark:bg-gray-800"
          >
            <FontAwesome5 name="camera" size={16} color="#6B7280" />
            <Text className="text-[10px] text-gray-500 mt-1">Add</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};
