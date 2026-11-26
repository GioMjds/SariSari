import { type ComponentProps, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, TextInput, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/ui';
import { INPUT_TEXT_CLASS, PLACEHOLDER_COLOR, inputClass } from './FormPrimitives';

export interface PickerOption {
  id: string;
  label: string;
}

interface OptionPickerSheetProps {
  visible: boolean;
  title: string;
  noun: string;
  options: PickerOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  /** Creates the option and resolves to its id, or null when it failed. */
  onCreate: (name: string) => Promise<string | null>;
}

/** Searchable single-select sheet that can create the typed value when nothing matches. */
export function OptionPickerSheet({
  visible,
  title,
  noun,
  options,
  selectedId,
  onSelect,
  onClose,
  onCreate,
}: OptionPickerSheetProps) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible) setQuery('');
  }, [visible]);

  const trimmed = query.trim();
  const filtered = useMemo(() => {
    const q = trimmed.toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, trimmed]);
  const hasExact = options.some(
    (o) => o.label.toLowerCase() === trimmed.toLowerCase(),
  );

  const pick = (id: string) => {
    onSelect(id);
    onClose();
  };

  const create = async () => {
    setCreating(true);
    const id = await onCreate(trimmed);
    setCreating(false);
    if (id) pick(id);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View className={inputClass()}>
        <FontAwesome name="search" size={14} color="#564E45" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`Search or type a new ${noun}`}
          placeholderTextColor={PLACEHOLDER_COLOR}
          accessibilityLabel={`Search ${noun}`}
          autoCorrect={false}
          returnKeyType="done"
          className={`${INPUT_TEXT_CLASS} ml-3`}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        keyboardShouldPersistTaps="handled"
        className="shrink"
        contentContainerStyle={{ paddingBottom: 8 }}
        ListHeaderComponent={
          <>
            {trimmed && !hasExact ? (
              <Pressable
                onPress={create}
                disabled={creating}
                accessibilityRole="button"
                accessibilityLabel={`Create ${noun} ${trimmed}`}
                className="min-h-[52px] flex-row items-center px-3 mb-1 rounded-xl bg-persimmon-50 border border-persimmon-200 active:opacity-80"
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#C8460F" />
                ) : (
                  <FontAwesome name="plus-circle" size={18} color="#C8460F" />
                )}
                <StyledText variant="semibold" className="flex-1 ml-3 text-persimmon-700 text-sm">
                  {`Create "${trimmed}"`}
                </StyledText>
              </Pressable>
            ) : null}
            {!trimmed ? (
              <OptionRow label="None" muted selected={!selectedId} onPress={() => pick('')} />
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <OptionRow
            label={item.label}
            selected={item.id === selectedId}
            onPress={() => pick(item.id)}
          />
        )}
        ListEmptyComponent={
          !trimmed ? (
            <StyledText variant="regular" className="text-ink-500 text-sm text-center py-6">
              {`No ${noun} yet. Type a name above to create one.`}
            </StyledText>
          ) : null
        }
      />
    </Sheet>
  );
}

function OptionRow({
  label,
  selected,
  muted,
  onPress,
}: {
  label: string;
  selected: boolean;
  muted?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      className={`min-h-[52px] flex-row items-center px-3 mb-1 rounded-xl active:bg-paper-200 ${
        selected ? 'bg-paper-100 border border-paper-400' : ''
      }`}
    >
      <StyledText
        variant={selected ? 'semibold' : 'regular'}
        className={`flex-1 text-base ${muted ? 'text-ink-500' : 'text-ink-900'}`}
      >
        {label}
      </StyledText>
      {selected ? <FontAwesome name="check" size={16} color="#C8460F" /> : null}
    </Pressable>
  );
}

interface SelectRowProps {
  label: string;
  icon: ComponentProps<typeof FontAwesome>['name'];
  value: string | undefined;
  placeholder: string;
  onPress: () => void;
}

/** Tappable row that shows the current choice and opens a picker. */
export function SelectRow({ label, icon, value, placeholder, onPress }: SelectRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? 'none'}`}
      accessibilityHint={`Opens the ${label.toLowerCase()} picker`}
      className="min-h-[56px] flex-row items-center px-3 rounded-xl bg-paper-100 border border-paper-300 active:bg-paper-200"
    >
      <View className="w-9 h-9 rounded-full bg-paper-50 border border-paper-300 items-center justify-center">
        <FontAwesome name={icon} size={14} color="#623418" />
      </View>
      <View className="flex-1 ml-3">
        <StyledText variant="medium" className="text-ink-500 text-xs">
          {label}
        </StyledText>
        <StyledText
          variant={value ? 'semibold' : 'regular'}
          numberOfLines={1}
          className={`text-base ${value ? 'text-ink-900' : 'text-ink-400'}`}
        >
          {value ?? placeholder}
        </StyledText>
      </View>
      <FontAwesome name="chevron-right" size={12} color="#7A7165" />
    </Pressable>
  );
}
