import { StyledText } from '@/components/elements';
import type { OverrideReasonCode } from '@/types/credits.types';
import { OVERRIDE_REASON_LABELS } from './OverrideReasonModal';

interface OverrideReasonLabelProps {
  code: OverrideReasonCode;
}

export function OverrideReasonLabel({ code }: OverrideReasonLabelProps) {
  return (
    <StyledText variant="medium" className="text-ink-600 text-xs">
      {OVERRIDE_REASON_LABELS[code]?.label ?? code}
    </StyledText>
  );
}
