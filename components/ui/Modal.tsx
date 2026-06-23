import React, { useEffect, useState } from 'react';
import {
  View,
  Pressable,
  Modal as RNModal,
  ActivityIndicator,
  AccessibilityInfo,
  type ModalProps as RNModalProps,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { useModalStore } from '@/stores';
import { ModalButton } from '@/types';

interface CustomModalProps extends Omit<
  RNModalProps,
  'visible' | 'onRequestClose'
> {
  id?: string;
  visible?: boolean;
  title?: string;
  description?: string;
  buttons?: ModalButton[];
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: keyof typeof FontAwesome.glyphMap;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  loading?: boolean;
  /** Per-button loading override. Falls back to the top-level `loading` prop for the first button. */
  buttonLoading?: boolean[];
}

/**
 * Modal — a tone-aware confirmation dialog. Backed by a Zustand store
 * (id-based open) or a controlled prop (visible). Mounts with a Moti
 * scale-in entrance; honors Reduce Motion by collapsing to opacity-only.
 */
export function Modal({
  id,
  visible,
  title,
  description,
  buttons,
  variant = 'default',
  icon,
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
  ...rest
}: CustomModalProps) {
  const { modals, closeModal } = useModalStore();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReducedMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (active) setReducedMotion(enabled);
      },
    );
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  const storeModal = id ? modals.find((m) => m.id === id) : null;

  const isVisible = id ? !!storeModal : !!visible;
  const finalTitle = storeModal?.title ?? title;
  const finalDescription = storeModal?.description ?? description;
  const finalButtons = storeModal?.buttons ?? buttons;
  const finalVariant = storeModal?.variant ?? variant;
  const finalIcon = storeModal?.icon
    ? (storeModal.icon as keyof typeof FontAwesome.glyphMap)
    : icon;
  const finalChildren = storeModal?.children ?? children;
  const finalCloseOnOverlay = storeModal?.closeOnOverlay ?? closeOnOverlay;
  const finalShowCloseButton = storeModal?.showCloseButton ?? showCloseButton;

  const handleClose = () => {
    if (id) closeModal(id);
    onClose?.();
  };

  const handleOverlayPress = () => {
    if (finalCloseOnOverlay) handleClose();
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm w-full';
      case 'md':
        return 'max-w-md w-full';
      case 'lg':
        return 'max-w-lg w-full';
      case 'xl':
        return 'max-w-xl w-full';
      default:
        return 'max-w-md w-full';
    }
  };

  // Tone palette: bg is the chip background; color is the icon hex
  // (FontAwesome requires a string, not a class).
  const getVariantStyles = () => {
    switch (finalVariant) {
      case 'danger':
        return {
          iconBg: 'bg-semantic-danger-50',
          iconColor: '#C13030',
          defaultIcon: 'exclamation-triangle',
        };
      case 'success':
        return {
          iconBg: 'bg-sage-50',
          iconColor: '#3D5E1B',
          defaultIcon: 'check-circle',
        };
      case 'warning':
        return {
          iconBg: 'bg-semantic-warning-50',
          iconColor: '#C77B0E',
          defaultIcon: 'exclamation-circle',
        };
      case 'info':
        return {
          iconBg: 'bg-semantic-info-50',
          iconColor: '#2E6FA8',
          defaultIcon: 'info-circle',
        };
      default:
        return {
          iconBg: 'bg-surface-warm',
          iconColor: '#B45309',
          defaultIcon: 'info-circle',
        };
    }
  };

  const variantStyles = getVariantStyles();
  const displayIcon = finalIcon || variantStyles.defaultIcon;

  if (!isVisible) return null;

  return (
    <RNModal
      {...rest}
      visible={isVisible}
      transparent={transparent}
      animationType={animationType}
      presentationStyle={presentationStyle}
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <View
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      >
        <Pressable
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
          onPress={handleOverlayPress}
          className="absolute inset-0"
        />
        <MotiView
          from={{
            opacity: 0,
            scale: reducedMotion ? 1 : 0.95,
          }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reducedMotion
              ? { type: 'timing', duration: 160 }
              : { type: 'spring', damping: 18, stiffness: 220 }
          }
          className={`bg-white rounded-2xl p-6 ${getSizeClasses()}`}
          style={{ zIndex: 1 }}
          accessibilityLabel={finalTitle || 'Dialog'}
        >
          {/* Header / Icon */}
          {(finalTitle ||
            finalDescription ||
            finalIcon ||
            finalVariant !== 'default') && (
            <View className="items-center mb-4">
              {(finalIcon || finalVariant !== 'default') && (
                <View
                  className={`${variantStyles.iconBg} rounded-full px-4 py-3 mb-3`}
                >
                  <FontAwesome
                    name={displayIcon as any}
                    size={36}
                    color={variantStyles.iconColor}
                  />
                </View>
              )}
              {finalTitle && (
                <StyledText
                  variant="extrabold"
                  className="text-warm-900 text-xl mb-2 text-center"
                >
                  {finalTitle}
                </StyledText>
              )}
              {finalDescription && (
                <StyledText
                  variant="regular"
                  className="text-warm-700 text-sm text-center"
                >
                  {finalDescription}
                </StyledText>
              )}
            </View>
          )}

          {/* Custom Content */}
          {finalChildren && <View className="mb-4">{finalChildren}</View>}

          {/* Buttons */}
          {finalButtons && finalButtons.length > 0 && (
            <View className="gap-3">
              {finalButtons.map((button: ModalButton, index: number) => {
                const isDestructive = button.style === 'destructive';
                const isCancel = button.style === 'cancel';
                const isLoading =
                  buttonLoading?.[index] ?? (loading && index === 0);

                let bgClass = 'bg-primary-500';
                let textClass = 'text-white';
                let borderClass = '';

                if (isDestructive) {
                  bgClass = 'bg-semantic-danger';
                } else if (isCancel) {
                  bgClass = 'bg-warm-200';
                  textClass = 'text-warm-900';
                }

                if (isLoading) {
                  borderClass = 'border border-persimmon-300';
                }

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
                    className={`${bgClass} ${borderClass} rounded-xl py-3 press-scale active:opacity-70`}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <StyledText
                        variant={isCancel ? 'semibold' : 'extrabold'}
                        className={`${textClass} text-center text-base`}
                      >
                        {button.text}
                      </StyledText>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Close Button (if no buttons and showCloseButton is true) */}
          {finalShowCloseButton &&
            (!finalButtons || finalButtons.length === 0) && (
              <Pressable
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="absolute top-4 right-4 z-10 w-8 h-8 justify-center items-center rounded-full bg-gray-100 press-scale active:opacity-70"
              >
                <FontAwesome name="times" size={18} color="#A89F90" />
              </Pressable>
            )}
        </MotiView>
      </View>
    </RNModal>
  );
}
