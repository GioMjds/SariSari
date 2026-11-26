import { type ComponentProps, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/ui';
import { useToastStore } from '@/stores';
import { pickProductImage, takeProductPhoto, getProductImageUri } from '@/lib/images';

interface ProductImagePickerProps {
  imageUri: string | null | undefined;
  onImageChange: (uri: string | null) => void;
}

/** Square photo tile; tapping opens a sheet to take, choose, or remove the photo. */
export function ProductImagePicker({ imageUri, onImageChange }: ProductImagePickerProps) {
  const [open, setOpen] = useState(false);
  const addToast = useToastStore((state) => state.addToast);
  const displayUri = getProductImageUri(imageUri);

  const run = async (getUri: () => Promise<string | null>, fallback: string) => {
    setOpen(false);
    // iOS refuses to present the picker while the sheet modal is still sliding out.
    await new Promise((r) => setTimeout(r, 250));
    try {
      const uri = await getUri();
      if (uri) onImageChange(uri);
    } catch (error) {
      addToast({
        message: error instanceof Error && error.message ? error.message : fallback,
        variant: 'danger',
      });
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={displayUri ? 'Change product photo' : 'Add product photo'}
        className={`w-24 h-24 rounded-2xl overflow-hidden items-center justify-center active:opacity-80 ${
          displayUri ? 'bg-paper-100' : 'bg-paper-100 border-2 border-dashed border-paper-400'
        }`}
      >
        {displayUri ? (
          <>
            <Image source={{ uri: displayUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
            <View className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-ink-900/70 items-center justify-center">
              <Ionicons name="camera" size={14} color="#FAFAF7" />
            </View>
          </>
        ) : (
          <>
            <Ionicons name="camera-outline" size={26} color="#564E45" />
            <StyledText variant="semibold" className="text-ink-500 text-xs mt-1">
              Add photo
            </StyledText>
          </>
        )}
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)} title="Product photo">
        <View className="gap-y-2 pb-2">
          <PhotoOption
            icon="camera"
            label="Take photo"
            hint="Snap the item on your counter"
            onPress={() => run(takeProductPhoto, 'Failed to open camera')}
          />
          <PhotoOption
            icon="images"
            label="Choose from gallery"
            hint="Use a photo already on this phone"
            onPress={() => run(pickProductImage, 'Failed to open gallery')}
          />
          {displayUri ? (
            <PhotoOption
              icon="trash"
              label="Remove photo"
              danger
              onPress={() => {
                setOpen(false);
                onImageChange(null);
              }}
            />
          ) : null}
        </View>
      </Sheet>
    </>
  );
}

function PhotoOption({
  icon,
  label,
  hint,
  danger,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  hint?: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-[56px] flex-row items-center px-3 rounded-xl border border-paper-300 active:bg-paper-100"
    >
      <View
        className={`w-10 h-10 rounded-full items-center justify-center ${
          danger ? 'bg-semantic-danger-50' : 'bg-persimmon-50'
        }`}
      >
        <Ionicons name={icon} size={18} color={danger ? '#C13030' : '#C8460F'} />
      </View>
      <View className="flex-1 ml-3">
        <StyledText
          variant="semibold"
          className={`text-base ${danger ? 'text-semantic-danger' : 'text-ink-900'}`}
        >
          {label}
        </StyledText>
        {hint ? (
          <StyledText variant="regular" className="text-ink-500 text-xs">
            {hint}
          </StyledText>
        ) : null}
      </View>
    </Pressable>
  );
}
