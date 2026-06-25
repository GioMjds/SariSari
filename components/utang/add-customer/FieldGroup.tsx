import { ReactNode } from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';

interface FieldGroupProps {
  /** Small uppercase label above the field block. */
  label: string;
  /** Optional star indicator after the label (required field). */
  required?: boolean;
  /** Optional one-line helper copy below the input. */
  helper?: string;
  /** Optional red error message (shown instead of helper when set). */
  error?: string;
  children: ReactNode;
}

/**
 * FieldGroup — labeled container for a single field inside the
 * parchment form sheet. Pure presentation; the input itself is
 * supplied as `children`.
 *
 * Provides:
 *   • Uppercase label in `text-cinnamon-500`
 *   • Required star in persimmon
 *   • Helper / error caption below the input
 */
export function FieldGroup({
  label,
  required,
  helper,
  error,
  children,
}: FieldGroupProps) {
  return (
    <View>
      <View className="flex-row items-baseline mb-1.5">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          {label}
        </StyledText>
        {required && (
          <StyledText
            variant="extrabold"
            className="text-persimmon-500 ml-1 text-xs"
          >
            *
          </StyledText>
        )}
      </View>
      {children}
      {error ? (
        <StyledText
          variant="medium"
          className="text-semantic-danger text-xs mt-1"
        >
          {error}
        </StyledText>
      ) : helper ? (
        <StyledText variant="regular" className="text-ink-400 text-xs mt-1">
          {helper}
        </StyledText>
      ) : null}
    </View>
  );
}