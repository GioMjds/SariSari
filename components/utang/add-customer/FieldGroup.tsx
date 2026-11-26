import { ReactNode } from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';

interface FieldGroupProps {
  /** Visible label above the field block. */
  label: string;
  /** Optional star indicator after the label (required field). */
  required?: boolean;
  /** Optional one-line helper copy below the input. */
  helper?: string;
  /** Optional red error message (shown instead of helper when set). */
  error?: string | undefined;
  /** Optional right-aligned caption under the input, e.g. a character count. */
  aside?: string;
  children: ReactNode;
}

/**
 * FieldGroup — labeled container for a single field inside the
 * parchment form sheet. Pure presentation; the input itself is
 * supplied as `children`.
 *
 * Provides:
 *   • Readable label with a persimmon required star
 *   • Helper / error caption below the input (errors announced politely)
 *   • Optional right-aligned aside caption
 */
export function FieldGroup({
  label,
  required,
  helper,
  error,
  aside,
  children,
}: FieldGroupProps) {
  const caption = error ?? helper;

  return (
    <View>
      <View className="flex-row items-baseline mb-1.5">
        <StyledText variant="semibold" className="text-caption text-ink-700">
          {label}
        </StyledText>
        {required ? (
          <StyledText
            variant="extrabold"
            className="text-persimmon-600 ml-1 text-xs"
            accessibilityLabel="required"
          >
            *
          </StyledText>
        ) : (
          <StyledText variant="regular" className="text-ink-400 ml-1.5 text-xs">
            Optional
          </StyledText>
        )}
      </View>
      {children}
      {caption || aside ? (
        <View className="flex-row items-start mt-1.5">
          <StyledText
            variant={error ? 'medium' : 'regular'}
            className={`flex-1 text-xs ${error ? 'text-semantic-danger' : 'text-ink-400'}`}
            accessibilityRole={error ? 'alert' : undefined}
            accessibilityLiveRegion={error ? 'polite' : 'none'}
          >
            {caption}
          </StyledText>
          {aside ? (
            <StyledText variant="medium" className="text-xs text-ink-400 ml-2">
              {aside}
            </StyledText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
