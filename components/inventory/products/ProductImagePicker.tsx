import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyledText } from '@/components/elements';
import { useToastStore } from '@/stores';
import {
  pickProductImage,
  takeProductPhoto,
  getProductImageUri,
} from '@/lib/images';

interface ProductImagePickerProps {
  imageUri: string | null | undefined;
  onImageChange: (uri: string | null) => void;
}

export function ProductImagePicker({
  imageUri,
  onImageChange,
}: ProductImagePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const displayUri = getProductImageUri(imageUri);

  const handleTakePhoto = async () => {
    setModalVisible(false);
    try {
      const uri = await takeProductPhoto();
      if (uri) {
        onImageChange(uri);
      }
    } catch (error: any) {
      addToast({
        message: error.message || 'Failed to open camera',
        variant: 'danger',
      });
    }
  };

  const handleChooseFromGallery = async () => {
    setModalVisible(false);
    try {
      const uri = await pickProductImage();
      if (uri) {
        onImageChange(uri);
      }
    } catch (error: any) {
      addToast({
        message: error.message || 'Failed to open gallery',
        variant: 'danger',
      });
    }
  };

  const handleRemovePhoto = () => {
    setModalVisible(false);
    onImageChange(null);
  };

  return (
    <View className="mb-4">
      <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
        Product Photo
      </StyledText>

      <View className="flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
          className="w-28 h-28 rounded-2xl bg-paper-100 border border-dashed border-ink-200 justify-center items-center overflow-hidden relative shadow-sm"
          style={styles.pickerBox}
        >
          {displayUri ? (
            <Image
              source={{ uri: displayUri }}
              className="w-full h-full"
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View className="items-center justify-center p-2">
              <Ionicons name="camera-outline" size={28} color="#7A7165" />
              <StyledText variant="medium" className="text-ink-400 text-xs mt-1 text-center">
                Add Photo
              </StyledText>
            </View>
          )}

          {displayUri && (
            <View className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Ionicons name="create" size={20} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>

        <View className="flex-1 justify-center">
          <StyledText variant="medium" className="text-ink-500 text-xs leading-relaxed">
            {displayUri
              ? 'Tap the image to change or remove it.'
              : 'Add a clear photo to easily identify this item at the POS counter.'}
          </StyledText>
          {displayUri && (
            <TouchableOpacity
              onPress={handleRemovePhoto}
              activeOpacity={0.7}
              className="flex-row items-center mt-2"
            >
              <FontAwesome name="trash" size={14} color="#C13030" />
              <StyledText variant="semibold" className="text-semantic-danger text-xs ml-1.5">
                Remove Photo
              </StyledText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Custom bottom-sheet image picker modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          onPress={() => setModalVisible(false)}
          style={{ backgroundColor: 'rgba(14, 12, 10, 0.6)' }}
        >
          <Pressable
            className="bg-white rounded-t-3xl p-6"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Center drag handle */}
            <View className="items-center mb-5">
              <View className="w-12 h-1 bg-ink-200 rounded-full" />
            </View>

            <StyledText variant="extrabold" className="text-ink-900 text-lg mb-4 text-center">
              Product Photo
            </StyledText>

            {/* Options List */}
            <View className="gap-3">
              {/* Option: Take Photo */}
              <TouchableOpacity
                onPress={handleTakePhoto}
                activeOpacity={0.8}
                className="flex-row items-center p-4 bg-paper-50 rounded-2xl border border-ink-100"
              >
                <View className="w-10 h-10 rounded-full bg-persimmon-50 items-center justify-center mr-3">
                  <Ionicons name="camera" size={20} color="#E85A1F" />
                </View>
                <View className="flex-1">
                  <StyledText variant="semibold" className="text-ink-900 text-sm">
                    Take Photo
                  </StyledText>
                  <StyledText variant="regular" className="text-ink-400 text-xs">
                    Use camera to snap a new picture
                  </StyledText>
                </View>
              </TouchableOpacity>

              {/* Option: Choose from Gallery */}
              <TouchableOpacity
                onPress={handleChooseFromGallery}
                activeOpacity={0.8}
                className="flex-row items-center p-4 bg-paper-50 rounded-2xl border border-ink-100"
              >
                <View className="w-10 h-10 rounded-full bg-persimmon-50 items-center justify-center mr-3">
                  <Ionicons name="images" size={20} color="#E85A1F" />
                </View>
                <View className="flex-1">
                  <StyledText variant="semibold" className="text-ink-900 text-sm">
                    Choose from Gallery
                  </StyledText>
                  <StyledText variant="regular" className="text-ink-400 text-xs">
                    Select an existing photo from library
                  </StyledText>
                </View>
              </TouchableOpacity>

              {/* Option: Remove Photo (Conditional) */}
              {imageUri && (
                <TouchableOpacity
                  onPress={handleRemovePhoto}
                  activeOpacity={0.8}
                  className="flex-row items-center p-4 bg-red-50 rounded-2xl border border-red-100"
                >
                  <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                    <Ionicons name="trash" size={20} color="#C13030" />
                  </View>
                  <View className="flex-1">
                    <StyledText variant="semibold" className="text-semantic-danger text-sm">
                      Remove Photo
                    </StyledText>
                    <StyledText variant="regular" className="text-red-400 text-xs">
                      Delete current product image
                    </StyledText>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
              className="mt-5 py-3.5 bg-ink-50 rounded-xl border border-ink-100 items-center justify-center"
            >
              <StyledText variant="semibold" className="text-ink-700 text-sm">
                Cancel
              </StyledText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerBox: {
    shadowColor: '#564E45',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
});
