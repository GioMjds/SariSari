import React from 'react';
import { StyledText } from '@/components/elements';
import { withFeatureGuard } from '@/components/withFeatureGuard';
import { View } from 'react-native';

function DamagedScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-paper-200">
      <StyledText
        variant="extrabold"
        className="text-h1 text-paper-900 text-3xl"
      >
        Damaged Inventory
      </StyledText>
      <StyledText
        variant="regular"
        className="text-sm text-paper-900 opacity-90 mt-1"
      >
        This feature is currently under development.
      </StyledText>
    </View>
  );
}

export default withFeatureGuard(DamagedScreen, !__DEV__);
