import { StatusPill } from '@/components/ui';
import { TrustTag } from '@/lib';

export function TrustTagPill({ tag }: { tag: TrustTag }) {
  const visual: Record<
    TrustTag,
    { variant: 'success' | 'info' | 'warning'; label: string }
  > = {
    good_payer: { variant: 'success', label: 'Good payer' },
    frequent_suki: { variant: 'info', label: 'Frequent suki' },
    needs_followup: { variant: 'warning', label: 'Needs follow-up' },
  };
  const v = visual[tag];
  return (
    <StatusPill variant={v.variant} size="sm" dot>
      {v.label}
    </StatusPill>
  );
}
