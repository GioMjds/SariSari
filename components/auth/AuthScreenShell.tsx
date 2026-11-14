import { FC, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
  /** 1-based. Omit to hide the step dots. */
  step?: number;
  totalSteps?: number;
  stepLabel?: string;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Full-screen frame shared by the Owner PIN setup and recovery flows.
 * Sari on top, copy, the input, then a pinned action footer.
 */
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
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {onBack ? (
          <Pressable
            testID="auth-shell-back"
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            hitSlop={8}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <FontAwesome name="arrow-left" size={16} color="#2A1A0E" />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        {step !== undefined && totalSteps !== undefined ? (
          <View
            style={styles.steps}
            accessible
            accessibilityLabel={stepLabel}
          >
            {Array.from({ length: totalSteps }, (_, idx) => (
              <View
                key={idx}
                style={[
                  styles.stepDot,
                  idx + 1 === step && styles.stepDotActive,
                  idx + 1 < step && styles.stepDotDone,
                ]}
              />
            ))}
          </View>
        ) : null}
        <View style={styles.backBtn} />
      </View>

      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
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
          style={styles.title}
        >
          {title}
        </StyledText>
        {subtitle ? (
          <StyledText variant="regular" style={styles.subtitle}>
            {subtitle}
          </StyledText>
        ) : null}
        <View style={styles.body}>{children}</View>
      </KeyboardAwareScrollView>

      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {footer}
        </View>
      ) : null}
    </View>
  );
};

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'success';
  testID?: string;
}

/** Footer button. One primary per screen. 52pt tall, full width. */
export const AuthButton: FC<ButtonProps> = ({
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
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'success' && styles.btnSuccess,
        variant === 'secondary' && styles.btnSecondary,
        blocked && styles.btnDisabled,
        pressed && styles.pressed,
      ]}
    >
      <StyledText
        variant="semibold"
        style={[styles.btnText, variant === 'secondary' && styles.btnTextDark]}
      >
        {label}
      </StyledText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F6F2' },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D6CCBF',
  },
  stepDotActive: { width: 24, backgroundColor: '#E85A1F' },
  stepDotDone: { backgroundColor: '#E85A1F' },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    color: '#28231D',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#564E45',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
  },
  body: { width: '100%', alignItems: 'center', marginTop: 28 },
  footer: { paddingHorizontal: 24, paddingTop: 12, gap: 8 },
  btn: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnPrimary: { backgroundColor: '#E85A1F' },
  btnSuccess: { backgroundColor: '#16A34A' },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6CCBF',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: '#FFFFFF', fontSize: 16 },
  btnTextDark: { color: '#3E3831' },
  pressed: { opacity: 0.75 },
});
