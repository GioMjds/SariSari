import { View } from 'react-native';
import { StyledText } from '@/components/elements';

interface SupplierAvatarProps {
  name: string;
  /** Large variant for the sheet header. */
  large?: boolean;
}

export function SupplierAvatar({ name, large = false }: SupplierAvatarProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`items-center justify-center bg-persimmon-50 rounded-xl ${large ? 'w-14 h-14' : 'w-12 h-12 mr-3'}`}
    >
      <StyledText variant={large ? 'black' : 'extrabold'} className={`text-persimmon-600 ${large ? 'text-h2' : 'text-xl'}`}>
        {name.trim().charAt(0).toUpperCase()}
      </StyledText>
    </View>
  );
}
