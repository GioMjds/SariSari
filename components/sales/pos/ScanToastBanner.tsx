import { StyledText } from '@/components/elements';
import { FC, useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface ScanToastBannerProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error';
  onHide: () => void;
}

export const ScanToastBanner: FC<ScanToastBannerProps> = ({
  visible,
  message,
  type = 'success',
  onHide,
}) => {
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1300),
        Animated.timing(translateY, {
          toValue: -60,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }
  }, [visible, message, onHide, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        type === 'error' ? styles.toastError : styles.toastSuccess,
        { transform: [{ translateY }] },
      ]}
    >
      <StyledText variant="semibold" style={styles.toastText}>
        {message}
      </StyledText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    zIndex: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  toastSuccess: {
    backgroundColor: '#2e7d32',
  },
  toastError: {
    backgroundColor: '#c62828',
  },
  toastText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
