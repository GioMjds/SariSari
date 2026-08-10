import { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { Modal } from '@/components/ui/Modal';

export interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkMoveCategory: () => void;
  onBulkAdjustStock: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkMoveCategory,
  onBulkAdjustStock,
}: BulkActionsToolbarProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (selectedCount === 0 && !confirmDelete) return null;

  const handleConfirmDelete = () => {
    setConfirmDelete(false);
    onBulkDelete();
  };

  return (
    <>
      {selectedCount > 0 ? (
        <View
          accessibilityRole="toolbar"
          accessibilityLabel={`Bulk actions, ${selectedCount} selected`}
          className="absolute bottom-6 left-6 right-6 bg-ink-900 px-4 py-3 rounded-2xl flex-row items-center justify-between border border-ink-700 shadow-2xl z-50"
        >
          <View className="flex-row items-center gap-x-2">
            <TouchableOpacity
              onPress={onClearSelection}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Clear selection"
              hitSlop={8}
              className="min-h-[44px] min-w-[44px] items-center justify-center -ml-3"
            >
              <FontAwesome name="close" size={16} color="#FAFAF7" />
            </TouchableOpacity>
            <StyledText variant="semibold" className="text-paper-50 font-bold text-sm">
              {selectedCount} selected
            </StyledText>
          </View>

          <View className="flex-row items-center gap-x-2">
            <TouchableOpacity
              onPress={onBulkAdjustStock}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Adjust stock for selected"
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              className="px-3 py-2.5 rounded-lg bg-ink-700 min-h-[44px] items-center justify-center"
            >
              <StyledText variant="extrabold" className="text-xs font-semibold text-paper-50">
                Adjust
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onBulkMoveCategory}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Move selected to another category"
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              className="px-3 py-2.5 rounded-lg bg-ink-700 min-h-[44px] items-center justify-center"
            >
              <StyledText variant="extrabold" className="text-xs font-semibold text-paper-50">
                Move
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setConfirmDelete(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Delete selected products"
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              className="px-3 py-2.5 rounded-lg bg-semantic-danger min-h-[44px] items-center justify-center"
            >
              <StyledText variant="extrabold" className="text-xs font-semibold text-paper-50">
                Delete
              </StyledText>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <Modal
        visible={confirmDelete}
        variant="danger"
        icon="trash"
        title={`Delete ${selectedCount} products?`}
        description="This cannot be undone. Stock movements linked to these products will remain in your ledger."
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setConfirmDelete(false),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: handleConfirmDelete,
          },
        ]}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}
