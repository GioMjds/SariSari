import React, { useEffect, useState } from 'react';
import {
  View,
  Pressable,
  Modal as RNModal,
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  type ModalProps as RNModalProps,
} from 'react-native';
import { Easing } from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { SariMascot, type SariState } from '@/components/mascot';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useModalStore } from '@/stores';
import { ModalButton } from '@/types';

interface CustomModalProps extends Omit<
  RNModalProps,
  'visible' | 'onRequestClose'
> {
  id?: string;
  visible?: boolean;
  useNativeModal?: boolean;
  title?: string;
  description?: string;
  buttons?: ModalButton[];
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: keyof typeof FontAwesome.glyphMap;
  /** Animated Sari shown in place of the icon circle, e.g. 'delete' for destructive confirms. */
  mascot?: SariState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  loading?: boolean;
  buttonLoading?: boolean[];
}

const SIZE_WIDTH = { sm: 384, md: 448, lg: 512, xl: 576 } as const;

// Icon tile tint and glyph color per variant; glyph colors hold 3:1 on their tile.
const VARIANTS = {
  default: { tile: 'bg-paper-100', color: '#28231D', icon: 'info-circle' },
  success: { tile: 'bg-sage-50', color: '#3D5E1B', icon: 'check-circle' },
  warning: {
    tile: 'bg-semantic-warning-50',
    color: '#A35F00',
    icon: 'exclamation-circle',
  },
  danger: {
    tile: 'bg-semantic-danger-50',
    color: '#C13030',
    icon: 'exclamation-triangle',
  },
  info: { tile: 'bg-semantic-info-50', color: '#2E6FA8', icon: 'info-circle' },
} as const;

const BUTTON_TONES = {
  default: {
    box: 'bg-persimmon-500 active:bg-persimmon-700',
    text: 'text-paper-50',
    spinner: '#FAFAF7',
  },
  destructive: {
    box: 'bg-semantic-danger active:opacity-80',
    text: 'text-paper-50',
    spinner: '#FAFAF7',
  },
  cancel: {
    box: 'bg-paper-100 border border-paper-300 active:bg-paper-300',
    text: 'text-ink-800',
    spinner: '#28231D',
  },
} as const;

const ENTER_EASING = Easing.out(Easing.cubic);

export function Modal({
  id,
  visible,
  useNativeModal,
  title,
  description,
  buttons,
  variant = 'default',
  icon,
  mascot,
  size = 'sm',
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  onClose,
  children,
  loading = false,
  buttonLoading,
  animationType = 'none',
  transparent = true,
  presentationStyle,
  statusBarTranslucent = true,
  ...rest
}: CustomModalProps) {
  const { modals, closeModal } = useModalStore();
  const reducedMotion = useReducedMotion();

  const storeModal = id ? modals.find((m) => m.id === id) : null;
  const [cachedModal, setCachedModal] = useState<any>(null);

  useEffect(() => {
    if (storeModal) {
      setCachedModal(storeModal);
    }
  }, [storeModal]);

  const activeModal = storeModal || cachedModal;
  const isVisible = id
    ? storeModal !== null || cachedModal !== null
    : !!visible;

  const finalTitle = activeModal?.title ?? title;
  const finalDescription = activeModal?.description ?? description;
  const finalButtons: ModalButton[] | undefined =
    activeModal?.buttons ?? buttons;
  const finalVariant: keyof typeof VARIANTS =
    activeModal?.variant ?? variant;
  const finalIcon = activeModal?.icon
    ? (activeModal.icon as keyof typeof FontAwesome.glyphMap)
    : icon;
  const finalChildren = activeModal?.children ?? children;
  const finalCloseOnOverlay = activeModal?.closeOnOverlay ?? closeOnOverlay;
  const finalCloseOnEscape = activeModal?.closeOnEscape ?? closeOnEscape;
  const finalShowCloseButton = activeModal?.showCloseButton ?? showCloseButton;
  const finalUseNativeModal = useNativeModal ?? false;

  const handleClose = () => {
    if (id) closeModal(id);
    onClose?.();
  };

  // Android Back closes the in-tree dialog; the native path gets it via onRequestClose.
  useEffect(() => {
    if (finalUseNativeModal || !isVisible || !finalCloseOnEscape) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  });

  const variantStyle = VARIANTS[finalVariant] ?? VARIANTS.default;
  const showIcon = !!finalIcon || finalVariant !== 'default';
  const hasButtons = !!finalButtons && finalButtons.length > 0;
  const buttonsInRow = finalButtons?.length === 2;

  const ModalContent = (
    <MotiView
      style={[StyleSheet.absoluteFill, styles.center]}
      pointerEvents={isVisible ? 'auto' : 'none'}
      exit={{ opacity: 0 }}
      exitTransition={{ type: 'timing', duration: 150 }}
    >
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: reducedMotion ? 0 : 180 }}
        className="absolute inset-0 bg-ink-900/50"
      >
        <Pressable
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
          onPress={() => finalCloseOnOverlay && handleClose()}
          style={StyleSheet.absoluteFill}
        />
      </MotiView>

      <MotiView
        from={{
          opacity: 0,
          scale: reducedMotion ? 1 : 0.96,
          translateY: reducedMotion ? 0 : 8,
        }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{
          type: 'timing',
          duration: reducedMotion ? 0 : 220,
          easing: ENTER_EASING,
        }}
        accessibilityViewIsModal
        onAccessibilityEscape={finalCloseOnEscape ? handleClose : undefined}
        accessibilityLabel={finalTitle || 'Dialog'}
        className="bg-paper-50 border border-paper-300 shadow-modal"
        style={[styles.card, { maxWidth: SIZE_WIDTH[size] ?? 448 }]}
      >
        {(finalTitle || finalDescription || showIcon || mascot) && (
          <View className="items-center">
            {mascot ? (
              <SariMascot state={mascot} size={96} style={{ marginBottom: 8 }} />
            ) : (
              showIcon && (
                <View
                  className={`${variantStyle.tile} w-12 h-12 rounded-xl items-center justify-center mb-3`}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <FontAwesome
                    name={(finalIcon || variantStyle.icon) as any}
                    size={22}
                    color={variantStyle.color}
                  />
                </View>
              )
            )}
            {finalTitle && (
              <StyledText
                variant="extrabold"
                accessibilityRole="header"
                className="text-h2 text-ink-900 text-center"
              >
                {finalTitle}
              </StyledText>
            )}
            {finalDescription && (
              <StyledText
                variant="regular"
                className="text-[15px] leading-[22px] text-ink-600 text-center mt-1.5"
              >
                {finalDescription}
              </StyledText>
            )}
          </View>
        )}

        {finalChildren && <View className="mt-4">{finalChildren}</View>}

        {hasButtons && (
          <View
            className={`mt-5 pt-4 border-t border-dashed border-paper-400 ${
              buttonsInRow ? 'flex-row gap-3' : 'gap-2.5'
            }`}
          >
            {finalButtons!.map((button, index) => {
              const tone = BUTTON_TONES[button.style ?? 'default'];
              const isLoading =
                buttonLoading?.[index] ??
                (loading && button.style !== 'cancel');

              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    button.onPress?.();
                    if (id) closeModal(id);
                  }}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={button.text}
                  accessibilityState={{ disabled: isLoading, busy: isLoading }}
                  className={`${tone.box} ${
                    buttonsInRow ? 'flex-1' : ''
                  } min-h-[48px] rounded-lg px-4 items-center justify-center press-scale`}
                >
                  {isLoading ? (
                    <ActivityIndicator color={tone.spinner} />
                  ) : (
                    <StyledText
                      variant={
                        button.style === 'cancel' ? 'semibold' : 'extrabold'
                      }
                      className={`${tone.text} text-center text-[15px]`}
                      numberOfLines={2}
                    >
                      {button.text}
                    </StyledText>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {finalShowCloseButton && !hasButtons && (
          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={4}
            className="absolute top-2 right-2 z-10 w-10 h-10 rounded-pill items-center justify-center active:bg-paper-100"
          >
            <FontAwesome name="times" size={16} color="#564E45" />
          </Pressable>
        )}
      </MotiView>
    </MotiView>
  );

  if (finalUseNativeModal) {
    return (
      <RNModal
        {...rest}
        visible={isVisible}
        transparent={transparent}
        animationType={animationType}
        presentationStyle={presentationStyle}
        onRequestClose={finalCloseOnEscape ? handleClose : () => {}}
        statusBarTranslucent={statusBarTranslucent}
        accessibilityViewIsModal
      >
        {ModalContent}
      </RNModal>
    );
  }

  return isVisible ? ModalContent : null;
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 9999,
    elevation: 9999,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    zIndex: 1,
  },
});
