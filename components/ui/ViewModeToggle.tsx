import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import type { ViewMode } from '@/stores/useViewModeStore';

// Two-column grids use 48.5% tiles; space-between turns the remainder into the gutter.
export const GRID_COLUMN_STYLE = {
  paddingHorizontal: 16,
  justifyContent: 'space-between',
} as const;

const OPTIONS = [
  { mode: 'grid', icon: 'th-large', label: 'Grid view' },
  { mode: 'list', icon: 'th-list', label: 'List view' },
] as const;

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

function ViewModeToggleImpl({ mode, onChange }: ViewModeToggleProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      className="flex-row bg-paper-100 border border-paper-300 rounded-xl p-0.5 gap-0.5"
    >
      {OPTIONS.map((option) => {
        const selected = option.mode === mode;
        return (
          <Pressable
            key={option.mode}
            onPress={() => onChange(option.mode)}
            hitSlop={4}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={option.label}
            className={`w-10 h-10 rounded-lg items-center justify-center ${
              selected ? 'bg-paper-50 border border-paper-300' : ''
            }`}
          >
            <FontAwesome
              name={option.icon}
              size={15}
              color={selected ? '#0E0C0A' : '#7A7165'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export const ViewModeToggle = memo(ViewModeToggleImpl);
