import { ComponentProps, forwardRef, useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface TextFieldProps extends TextInputProps {
  icon?: ComponentProps<typeof FontAwesome>['name'];
  /** Static text shown before the input, e.g. a currency sign. */
  prefix?: string;
  invalid?: boolean;
}

/**
 * TextField — paper input shell used by every add-customer field.
 * Focus state is local so only the focused field re-renders.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField(
    { icon, prefix, invalid, multiline, onFocus, onBlur, className, ...rest },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const border = invalid
      ? 'border-semantic-danger'
      : focused
        ? 'border-persimmon-500 bg-paper-50'
        : 'border-ink-100';

    return (
      <View
        className={`bg-paper-100 rounded-xl border px-3 flex-row ${
          multiline ? 'items-start py-2' : 'items-center min-h-[48px]'
        } ${border}`}
      >
        {icon ? (
          <FontAwesome
            name={icon}
            size={15}
            color={invalid ? '#C13030' : focused ? '#C8460F' : '#7A7165'}
            style={multiline ? { marginTop: 9 } : undefined}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : null}
        {prefix ? (
          <StyledText variant="extrabold" className="text-ink-900 text-base ml-2">
            {prefix}
          </StyledText>
        ) : null}
        <TextInput
          ref={ref}
          multiline={multiline}
          placeholderTextColor="#A89F90"
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={`flex-1 py-2 font-stack-sans ${icon || prefix ? 'ml-2' : ''} text-base text-ink-900 ${className ?? ''}`}
          {...rest}
        />
      </View>
    );
  },
);
