import { memo, type ReactNode } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { StyledText } from '@/components/elements';
import { getProductImageUri } from '@/lib';

// Calm token pairs for photo-less products; persimmon stays reserved for actions.
const TINTS = [
  { bg: 'bg-cinnamon-50', text: 'text-cinnamon-600' },
  { bg: 'bg-sage-50', text: 'text-sage-700' },
  { bg: 'bg-semantic-info-50', text: 'text-semantic-info' },
  { bg: 'bg-semantic-warning-50', text: 'text-cinnamon-500' },
  { bg: 'bg-paper-300', text: 'text-ink-600' },
] as const;

export function getProductInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (
    words
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase() || '?'
  );
}

function tintFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return TINTS[Math.abs(hash) % TINTS.length]!;
}

interface ProductThumbProps {
  name: string;
  imageUri: string | null | undefined;
  /** Sizing and rounding for the frame, e.g. "w-16 h-16 rounded-xl". */
  className: string;
  initialsClassName?: string;
  /** Overlays such as stock or bundle badges, absolutely positioned by the caller. */
  children?: ReactNode;
}

function ProductThumbImpl({
  name,
  imageUri,
  className,
  initialsClassName = 'text-lg',
  children,
}: ProductThumbProps) {
  const uri = getProductImageUri(imageUri);
  const tint = tintFor(name);

  return (
    <View
      className={`overflow-hidden items-center justify-center ${uri ? 'bg-paper-300' : tint.bg} ${className}`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {uri ? (
        <Image
          source={{ uri }}
          recyclingKey={uri}
          contentFit="cover"
          transition={120}
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <StyledText
          variant="black"
          className={`${tint.text} ${initialsClassName}`}
        >
          {getProductInitials(name)}
        </StyledText>
      )}
      {children}
    </View>
  );
}

export const ProductThumb = memo(ProductThumbImpl);
