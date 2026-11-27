import { Sheet, SheetActionGroup, SheetActionRow, SheetDeleteAction } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { View } from 'react-native';

interface SaleMoreSheetProps {
  visible: boolean;
  onClose: () => void;
  refLabel: string;
  onCopyRef: () => void;
  /** False once a void, refund or price fix exists, because the correction log must keep the sale. */
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
}

// Rare actions kept out of the header: copy the ref, and a separated, two-step delete.
export function SaleMoreSheet({
  visible,
  onClose,
  refLabel,
  onCopyRef,
  canDelete,
  deleting,
  onDelete,
}: SaleMoreSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title="More">
      <SheetActionGroup>
        <SheetActionRow
          icon="clipboard"
          label="Copy reference no."
          hint={refLabel}
          onPress={onCopyRef}
        />
      </SheetActionGroup>
      <View className="pt-2">
        {canDelete ? (
          <SheetDeleteAction
            label="Delete sale"
            prompt="Delete this sale for good?"
            detail="Stock goes back to inventory. This can't be undone. To keep a record instead, use Fix sale, then Void."
            busy={deleting}
            onConfirm={onDelete}
          />
        ) : (
          <StyledText variant="regular" className="text-ink-500 text-xs text-center">
            {"This sale has a correction on record, so it can't be deleted."}
          </StyledText>
        )}
      </View>
    </Sheet>
  );
}
