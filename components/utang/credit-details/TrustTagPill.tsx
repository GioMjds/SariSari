import { useTranslation } from 'react-i18next';
import { StatusPill } from '@/components/ui';
import { TrustTag } from '@/lib';

const VISUAL = {
  good_payer: { variant: 'success', key: 'detailTrustGoodPayer' },
  frequent_suki: { variant: 'info', key: 'detailTrustFrequent' },
  needs_followup: { variant: 'warning', key: 'detailTrustFollowUp' },
} as const;

export function TrustTagPill({ tag }: { tag: TrustTag }) {
  const { t } = useTranslation('utang');
  const v = VISUAL[tag];
  return (
    <StatusPill variant={v.variant} size="sm" dot>
      {t(v.key)}
    </StatusPill>
  );
}
