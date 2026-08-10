import React, { useMemo, useState } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface Props {
  products: any[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export function ProductPicker({ products, selectedId, onSelect }: Props) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return products
      .filter(
        (p: any) =>
          p.name?.toLowerCase().includes(query) || p.barcode === q,
      )
      .slice(0, 6);
  }, [products, q]);

  return (
    <View className="gap-y-2">
      <StyledText variant="regular" className="text-xs text-ink-500">Product</StyledText>
      <View className="flex-row items-center bg-paper-100 border border-paper-300 rounded-xl px-3">
        <FontAwesome name="search" size={12} color="#623418" />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search by name or barcode"
          accessibilityLabel="Product picker search"
          className="flex-1 px-2 py-2.5 text-ink-900"
        />
      </View>
      <View className="gap-y-1">
        {filtered.map((p: any) => {
          const isActive = p.id === selectedId;
          return (
            <Pressable
              key={String(p.id)}
              onPress={() => onSelect(p.id)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${p.name}`}
              className={`min-h-[44px] px-3 rounded-xl flex-row items-center justify-between border ${
                isActive
                  ? 'bg-cinnamon-500 border-cinnamon-500'
                  : 'bg-paper-50 border-paper-200'
              }`}
            >
              <StyledText
                variant="semibold"
                className={`text-sm ${isActive ? 'text-paper-50' : 'text-ink-900'}`}
              >
                {p.name}
              </StyledText>
              <StyledText
                variant="regular"
                className={`text-[11px] ${isActive ? 'text-paper-200' : 'text-ink-500'}`}
              >
                {p.quantity ?? 0} in stock
              </StyledText>
            </Pressable>
          );
        })}
        {filtered.length === 0 ? (
          <StyledText variant="regular" className="text-xs text-ink-500 py-2 text-center">
            No matches.
          </StyledText>
        ) : null}
      </View>
    </View>
  );
}
