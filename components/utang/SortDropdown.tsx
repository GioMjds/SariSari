import { CreditSort } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface SortDropdownProps {
  activeSort: CreditSort;
  onSortChange: (sort: CreditSort) => void;
}

interface SortOption {
  key: CreditSort;
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
}

const sortOptions: SortOption[] = [
  { key: 'balance_desc', label: 'Highest Balance', icon: 'arrow-down' },
  { key: 'balance_asc', label: 'Lowest Balance', icon: 'arrow-up' },
  { key: 'recent', label: 'Most Recent', icon: 'clock-o' },
  { key: 'name_asc', label: 'Name A-Z', icon: 'sort-alpha-asc' },
  { key: 'name_desc', label: 'Name Z-A', icon: 'sort-alpha-desc' },
];

export function SortDropdown({
  activeSort,
  onSortChange,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const activeOption = sortOptions.find((opt) => opt.key === activeSort);

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setIsOpen(true)}
        className="flex-row items-center bg-white border border-warm-200 rounded-lg px-3 py-2"
      >
        <FontAwesome name="sort" size={14} color="#B45309" />
        <StyledText variant="medium" className="text-primary-500 text-sm ml-2 mr-1">
          {activeOption?.label}
        </StyledText>
        <FontAwesome name="chevron-down" size={12} color="#B45309" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setIsOpen(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl p-4"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center mb-4">
              <View className="w-12 h-1 bg-warm-200 rounded-full" />
            </View>

            <StyledText
              variant="semibold"
              className="text-primary-500 text-lg mb-4 px-2"
            >
              Sort By
            </StyledText>

            {sortOptions.map((option) => {
              const isActive = activeSort === option.key;

              return (
                <TouchableOpacity
                  key={option.key}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSortChange(option.key);
                    setIsOpen(false);
                  }}
                  className={`flex-row items-center justify-between p-4 rounded-xl mb-2 ${
                    isActive ? 'bg-secondary-50' : 'bg-warm-50'
                  }`}
                >
                  <View className="flex-row items-center">
                    <FontAwesome
                      name={option.icon}
                      size={16}
                      color={isActive ? '#B45309' : '#A8A29E'}
                    />
                    <StyledText
                      variant={isActive ? 'semibold' : 'medium'}
                      className={`ml-3 ${isActive ? 'text-primary-500' : 'text-warm-700'}`}
                    >
                      {option.label}
                    </StyledText>
                  </View>

                  {isActive && (
                    <FontAwesome name="check" size={16} color="#B45309" />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsOpen(false)}
              className="bg-warm-200 p-4 rounded-xl mt-2"
            >
              <StyledText
                variant="semibold"
                className="text-warm-700 text-center"
              >
                Cancel
              </StyledText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
