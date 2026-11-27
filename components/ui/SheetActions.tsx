import { Children, Fragment, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

type IconName = keyof typeof FontAwesome.glyphMap;

/** Grouped card of action rows with hairline dividers between them. */
export function SheetActionGroup({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View className="rounded-xl border border-paper-300 bg-paper-100 overflow-hidden">
      {items.map((child, i) => (
        <Fragment key={i}>
          {i > 0 ? <View className="h-px bg-paper-300 ml-[60px]" /> : null}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

interface SheetActionRowProps {
  icon: IconName;
  label: string;
  hint: string;
  iconColor?: string;
  /** Greys the row out and blocks taps; the hint should say why. */
  disabled?: boolean;
  onPress: () => void;
}

export function SheetActionRow({
  icon,
  label,
  hint,
  iconColor = '#564E45',
  disabled = false,
  onPress,
}: SheetActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
      className={`min-h-[60px] px-3 flex-row items-center gap-x-3 active:bg-paper-200 ${disabled ? 'opacity-45' : ''}`}
    >
      <View className="w-9 h-9 rounded-lg bg-paper-50 border border-paper-300 items-center justify-center">
        <FontAwesome name={icon} size={15} color={iconColor} />
      </View>
      <View className="flex-1">
        <StyledText variant="extrabold" className="text-[15px] text-ink-900">
          {label}
        </StyledText>
        <StyledText variant="regular" className="text-caption text-ink-500">
          {hint}
        </StyledText>
      </View>
      <FontAwesome name="angle-right" size={18} color="#A89F90" />
    </Pressable>
  );
}

interface SheetDeleteActionProps {
  /** Resting button text, e.g. "Delete product". */
  label: string;
  /** Question shown once armed, e.g. "Remove Coke 1L from your catalog?". */
  prompt: string;
  /** Extra consequence line under the prompt. */
  detail?: string;
  busy?: boolean;
  onConfirm: () => void;
}

/** Two-step delete: the first tap arms an inline confirm, the second deletes. */
export function SheetDeleteAction({
  label,
  prompt,
  detail,
  busy = false,
  onConfirm,
}: SheetDeleteActionProps) {
  const [armed, setArmed] = useState(false);

  const arm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
    setArmed(true);
  };

  if (!armed) {
    return (
      <Pressable
        onPress={arm}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Asks for confirmation first"
        className="min-h-[48px] rounded-xl flex-row items-center justify-center gap-x-2 border border-dashed border-semantic-danger-100 active:bg-semantic-danger-50"
      >
        <FontAwesome name="trash-o" size={15} color="#C13030" />
        <StyledText
          variant="extrabold"
          className="text-semantic-danger text-[15px]"
        >
          {label}
        </StyledText>
      </Pressable>
    );
  }

  return (
    <View
      accessibilityLiveRegion="polite"
      className="rounded-xl border border-semantic-danger-100 bg-semantic-danger-50 p-3 gap-y-3"
    >
      <View className="flex-row items-start gap-x-2.5">
        <FontAwesome
          name="exclamation-triangle"
          size={14}
          color="#C13030"
          style={{ marginTop: 3 }}
        />
        <View className="flex-1">
          <StyledText variant="extrabold" className="text-body text-ink-900">
            {prompt}
          </StyledText>
          {detail ? (
            <StyledText
              variant="regular"
              className="text-caption text-ink-700 mt-0.5"
            >
              {detail}
            </StyledText>
          ) : null}
        </View>
      </View>
      <View className="flex-row gap-x-3">
        <Pressable
          onPress={() => setArmed(false)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Keep it"
          className="flex-1 min-h-[48px] rounded-lg items-center justify-center bg-paper-50 border border-paper-400 active:bg-paper-300 press-scale"
        >
          <StyledText variant="semibold" className="text-ink-800 text-[15px]">
            Keep
          </StyledText>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`Confirm: ${label}`}
          accessibilityState={{ disabled: busy, busy }}
          className="flex-1 min-h-[48px] rounded-lg flex-row items-center justify-center gap-x-2 bg-semantic-danger active:opacity-80 press-scale"
        >
          {busy ? (
            <ActivityIndicator color="#FBF7EE" />
          ) : (
            <>
              <FontAwesome name="trash" size={14} color="#FBF7EE" />
              <StyledText
                variant="extrabold"
                className="text-paper-50 text-[15px]"
              >
                Delete
              </StyledText>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
