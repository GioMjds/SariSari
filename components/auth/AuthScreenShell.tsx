import { FC, ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SariMascot, type SariState } from '@/components/mascot';
import { StyledText } from '@/components/elements/StyledText';

interface Props {
  title: string;
  subtitle?: string;
  sari: SariState;
  sariLabel?: string;
  step?: number;
  totalSteps?: number;
  stepLabel?: string;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const AuthScreenShell: FC<Props> = ({
  title,
  subtitle,
  sari,
  sariLabel,
  step,
  totalSteps,
  stepLabel,
  onBack,
  backLabel,
  children,
  footer,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-paper-200 paper-texture">
      <View
        className="flex-row items-center justify-between px-5 pb-2"
        style={{ paddingTop: insets.top + 8 }}
      >
        {onBack ? (
          <Pressable
            testID="auth-shell-back"
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            hitSlop={8}
            className="w-12 h-12 rounded-full items-center justify-center active:bg-paper-300 active:scale-95"
          >
            <FontAwesome name="arrow-left" size={16} color="#28231D" />
          </Pressable>
        ) : (
          <View className="w-12 h-12" />
        )}

        {step !== undefined && totalSteps !== undefined ? (
          <View
            className="flex-row items-center gap-x-2"
            accessible
            accessibilityLabel={stepLabel}
          >
            {Array.from({ length: totalSteps }, (_, idx) => (
              <View
                key={idx}
                className={`h-2 rounded-full ${
                  idx + 1 === step
                    ? 'w-6 bg-persimmon-500'
                    : idx + 1 < step
                      ? 'w-2 bg-persimmon-500'
                      : 'w-2 bg-paper-400'
                }`}
              />
            ))}
          </View>
        ) : null}

        <View className="w-12 h-12" />
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
      >
        <SariMascot
          state={sari}
          size={132}
          {...(sariLabel !== undefined && { accessibilityLabel: sariLabel })}
        />
        <StyledText
          variant="extrabold"
          accessibilityRole="header"
          className="text-h2 text-ink-900 text-center mt-2"
        >
          {title}
        </StyledText>
        {subtitle ? (
          <StyledText
            variant="regular"
            className="text-body text-ink-500 text-center mt-2 max-w-[320px]"
          >
            {subtitle}
          </StyledText>
        ) : null}
        <View className="w-full items-center mt-7">{children}</View>
      </KeyboardAwareScrollView>

      {footer ? (
        <View
          className="px-6 pt-3 bg-paper-200"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
};

// AuthButton remains the same as previous response
export const AuthButton: FC<any> = ({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  testID,
}) => {
  const blocked = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={blocked ? undefined : onPress}
      disabled={blocked}
      className={`min-h-[52px] rounded-2xl items-center justify-center px-5 ${
        blocked ? 'opacity-45' : 'active:scale-95'
      } ${
        variant === 'primary'
          ? 'bg-persimmon-500'
          : variant === 'success'
            ? 'bg-sage-500'
            : 'bg-paper-50 border border-paper-300'
      }`}
    >
      <StyledText
        variant="semibold"
        className={`text-[16px] ${variant === 'secondary' ? 'text-ink-700' : 'text-paper-50'}`}
      >
        {label}
      </StyledText>
    </Pressable>
  );
};
