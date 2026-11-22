import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/ui/Sheet';

interface CategoryFormSheetProps {
  visible: boolean;
  mode: 'add' | 'edit';
  /** Current name when renaming; empty when adding. */
  initialName: string;
  /** Lowercased names already taken, excluding the one being renamed. */
  takenNames: string[];
  saving: boolean;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

const MAX_LENGTH = 40;

// Common sari-sari shelves offered as one-tap starters when adding.
const QUICK_PICKS = [
  'Beverages',
  'Snacks',
  'Canned Goods',
  'Condiments',
  'Rice & Grains',
  'Noodles',
  'Toiletries',
  'Household',
];

export function CategoryFormSheet({
  visible,
  mode,
  initialName,
  takenNames,
  saving,
  onSubmit,
  onClose,
}: CategoryFormSheetProps) {
  const [name, setName] = useState(initialName);
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initialName);
    setTouched(false);
  }, [visible, initialName]);

  const trimmed = name.trim();
  const error = !trimmed
    ? 'Enter a category name.'
    : takenNames.includes(trimmed.toLowerCase())
      ? `"${trimmed}" already exists.`
      : null;
  const showError = touched && error !== null;

  const picks = useMemo(
    () =>
      mode === 'add'
        ? QUICK_PICKS.filter((p) => !takenNames.includes(p.toLowerCase()))
        : [],
    [mode, takenNames],
  );

  const submit = () => {
    setTouched(true);
    if (error || saving) return;
    if (mode === 'edit' && trimmed === initialName.trim()) {
      onClose();
      return;
    }
    onSubmit(trimmed);
  };

  const borderClass = showError
    ? 'border-semantic-danger'
    : focused
      ? 'border-persimmon-400'
      : 'border-paper-300';

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={mode === 'add' ? 'New category' : 'Rename category'}
    >
      <View className="gap-y-1.5">
        <StyledText variant="semibold" className="text-caption text-ink-700">
          Category name
        </StyledText>
        <View
          className={`flex-row items-center bg-paper-100 border rounded-xl px-3 ${borderClass}`}
        >
          <FontAwesome name="folder-o" size={15} color="#7A7165" />
          <TextInput
            value={name}
            onChangeText={setName}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              if (name.length > 0) setTouched(true);
            }}
            onSubmitEditing={submit}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            maxLength={MAX_LENGTH}
            placeholder="e.g. Beverages"
            placeholderTextColor="#A89F90"
            accessibilityLabel="Category name"
            accessibilityHint={showError ? error : undefined}
            className="flex-1 min-h-[52px] px-2.5 font-stack-sans text-base text-ink-900"
          />
          {name.length > 0 ? (
            <Pressable
              onPress={() => setName('')}
              accessibilityRole="button"
              accessibilityLabel="Clear name"
              hitSlop={8}
              className="w-8 h-8 rounded-pill items-center justify-center active:bg-paper-200"
            >
              <FontAwesome name="times-circle" size={16} color="#A89F90" />
            </Pressable>
          ) : null}
        </View>
        <View className="flex-row items-start justify-between gap-x-3">
          {showError ? (
            <StyledText
              variant="medium"
              accessibilityLiveRegion="polite"
              className="flex-1 text-caption text-semantic-danger"
            >
              {error}
            </StyledText>
          ) : (
            <StyledText
              variant="regular"
              className="flex-1 text-caption text-ink-500"
            >
              {mode === 'add'
                ? 'Group similar items so they are quicker to find.'
                : 'Products in this category keep their stock and prices.'}
            </StyledText>
          )}
          <StyledText
            variant="medium"
            className="text-caption text-ink-400"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {name.length}/{MAX_LENGTH}
          </StyledText>
        </View>
      </View>

      {picks.length > 0 ? (
        <View className="gap-y-2">
          <StyledText variant="semibold" className="text-caption text-ink-700">
            Quick picks
          </StyledText>
          <View className="flex-row flex-wrap gap-2">
            {picks.map((pick) => {
              const active = trimmed === pick;
              return (
                <Pressable
                  key={pick}
                  onPress={() => {
                    setName(pick);
                    setTouched(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${pick}`}
                  accessibilityState={{ selected: active }}
                  className={`h-10 px-3.5 rounded-pill border flex-row items-center gap-x-1.5 press-scale ${
                    active
                      ? 'bg-persimmon-50 border-persimmon-400'
                      : 'bg-paper-50 border-paper-300 active:bg-paper-200'
                  }`}
                >
                  <FontAwesome
                    name={active ? 'check' : 'plus'}
                    size={10}
                    color={active ? '#C2410C' : '#7A7165'}
                  />
                  <StyledText
                    variant="semibold"
                    className={`text-sm ${active ? 'text-persimmon-700' : 'text-ink-700'}`}
                  >
                    {pick}
                  </StyledText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={submit}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel={mode === 'add' ? 'Add category' : 'Save name'}
        accessibilityState={{ disabled: saving, busy: saving }}
        className={`min-h-[52px] rounded-lg flex-row items-center justify-center gap-x-2 press-scale ${
          trimmed ? 'bg-persimmon-500 active:bg-persimmon-700' : 'bg-paper-300'
        }`}
      >
        {saving ? (
          <ActivityIndicator color="#FBF7EE" />
        ) : (
          <>
            <FontAwesome
              name={mode === 'add' ? 'plus' : 'check'}
              size={14}
              color={trimmed ? '#FBF7EE' : '#7A7165'}
            />
            <StyledText
              variant="extrabold"
              className={`text-[15px] ${trimmed ? 'text-paper-50' : 'text-ink-500'}`}
            >
              {mode === 'add' ? 'Add category' : 'Save name'}
            </StyledText>
          </>
        )}
      </Pressable>
    </Sheet>
  );
}
