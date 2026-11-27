import { StyledText } from '@/components/elements';
import { Sheet, SheetActionGroup, SheetActionRow } from '@/components/ui';
import { ICON_COLOR } from '@/lib/theme';

interface SaleFixSheetProps {
  visible: boolean;
  onClose: () => void;
  /** False once the void window has passed; price fixes stay open. */
  windowOpen: boolean;
  windowHours: number;
  onVoid: () => void;
  onRefund: () => void;
  onPriceCorrection: () => void;
}

// Explains each correction in one line so the owner picks the right one.
export function SaleFixSheet({
  visible,
  onClose,
  windowOpen,
  windowHours,
  onVoid,
  onRefund,
  onPriceCorrection,
}: SaleFixSheetProps) {
  const closedHint = `Window closed. Sales can be voided within ${windowHours}h.`;

  return (
    <Sheet visible={visible} onClose={onClose} title="Fix this sale">
      <SheetActionGroup>
        <SheetActionRow
          icon="ban"
          iconColor={ICON_COLOR.danger}
          label="Void sale"
          hint={windowOpen ? 'Mistake at the counter. Restores stock, removes it from sales.' : closedHint}
          disabled={!windowOpen}
          onPress={onVoid}
        />
        <SheetActionRow
          icon="undo"
          iconColor={ICON_COLOR.cinnamon}
          label="Refund"
          hint={windowOpen ? 'Customer returned items. Restores stock, records cash back.' : closedHint}
          disabled={!windowOpen}
          onPress={onRefund}
        />
        <SheetActionRow
          icon="pencil"
          iconColor={ICON_COLOR.ink}
          label="Edit price"
          hint="Wrong price was charged. Keeps the sale, fixes the total."
          onPress={onPriceCorrection}
        />
      </SheetActionGroup>
      <StyledText variant="regular" className="text-ink-500 text-xs text-center">
        Each fix is saved in the corrections log with its reason.
      </StyledText>
    </Sheet>
  );
}
