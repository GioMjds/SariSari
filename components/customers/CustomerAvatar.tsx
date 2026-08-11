import React from 'react';
import { View, Image } from 'react-native';
import { StyledText } from '@/components/elements';

interface CustomerAvatarProps {
  name: string;
  photoUri?: string | null;
  size?: number;
}

export const CustomerAvatar: React.FC<CustomerAvatarProps> = ({
  name,
  photoUri,
  size = 44,
}) => {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : '??';

  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-cinnamon-100 items-center justify-center border border-cinnamon-200"
    >
      <StyledText variant="extrabold" className="text-cinnamon-700 text-sm">
        {initials}
      </StyledText>
    </View>
  );
};
