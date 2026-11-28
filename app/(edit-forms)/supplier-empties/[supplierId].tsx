import { withProf } from '@/utils/perf';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Href, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import {
  PAYABLES_COLUMN,
  PayablesError,
  PayablesHeader,
  PayablesSkeleton,
} from '@/components/payables/PayablesHeader';
import { Sheet } from '@/components/ui';
import {
  useCreateEmptiesType,
  useEmptiesBalances,
  useRecordSwapCount,
  useSwapPreview,
} from '@/hooks/useSupplierEmpties';
import { useGetSupplier } from '@/hooks/useSuppliers';
import { formatPesos } from '@/lib/money';
import { ICON_COLOR } from '@/lib/theme';
import { useToastStore } from '@/stores';
import type { EmptiesBalance } from '@/types/supplierEmpties.types';

const BACK_ROUTE = '/(edit-forms)/supplier-payables' as Href;
const toCount = (v: string) => (/^\d+$/.test(v) ? Number(v) : 0);
const digits = (v: string) => v.replace(/\D/g, '');
const INPUT =
  'min-h-[48px] bg-paper-100 border border-ink-200 rounded-xl px-3 text-ink-900 text-base font-stack-sans';

function SupplierEmpties() {
  const { supplierId = '' } = useLocalSearchParams<{ supplierId: string }>();
  const { t } = useTranslation('receiving');
  const addToast = useToastStore((s) => s.addToast);
  const supplierQuery = useGetSupplier(supplierId);
  const balancesQuery = useEmptiesBalances(supplierId);
  const createMutation = useCreateEmptiesType();
  const swapMutation = useRecordSwapCount();

  const [sheet, setSheet] = useState<'type' | 'swap' | null>(null);
  const [target, setTarget] = useState<EmptiesBalance | null>(null);
  const [name, setName] = useState('');
  const [deposit, setDeposit] = useState('');
  const [full, setFull] = useState('');
  const [back, setBack] = useState('');
  const [held, setHeld] = useState('');
  // Double-tap guard on top of the disabled buttons.
  const busy = useRef(false);

  const supplier = supplierQuery.data ?? null;
  const balances = balancesQuery.data ?? [];

  const input =
    sheet === 'swap' && target && held !== ''
      ? {
          emptiesId: target.id,
          receivedFull: toCount(full),
          handedBack: toCount(back),
          physicalCount: toCount(held),
        }
      : null;
  const preview = useSwapPreview(input).data;

  const openSwap = (b: EmptiesBalance) => {
    setTarget(b);
    setFull('');
    setBack('');
    setHeld('');
    setSheet('swap');
  };

  const run = async (write: () => Promise<unknown>, successKey: string) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await write();
      setSheet(null);
      addToast({ message: t(successKey), variant: 'success' });
    } catch {
      addToast({ message: t('emptiesError'), variant: 'danger' });
    } finally {
      busy.current = false;
    }
  };

  const saveType = () =>
    run(
      () => createMutation.mutateAsync({ supplierId, name, depositPesos: toCount(deposit) }),
      'emptiesTypeAdded',
    );
  const saveSwap = () => {
    if (input) void run(() => swapMutation.mutateAsync({ input }), 'emptiesSwapSaved');
  };

  const loading = supplierQuery.isLoading || balancesQuery.isLoading;
  const failed = supplierQuery.isError || balancesQuery.isError;
  const retry = () => {
    void supplierQuery.refetch();
    void balancesQuery.refetch();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <PayablesHeader
        title={supplier?.name ?? t('emptiesTitle')}
        subtitle={t('emptiesTitle')}
        fallback={BACK_ROUTE}
      />

      {loading ? (
        <PayablesSkeleton rows={2} />
      ) : failed ? (
        <PayablesError onRetry={retry} />
      ) : (
        <ScrollView contentContainerStyle={[{ padding: 16, paddingBottom: 40 }, PAYABLES_COLUMN]}>
          {balances.length === 0 ? (
            <StyledText variant="regular" className="text-ink-600 text-sm mb-4">
              {t('emptiesNone')}
            </StyledText>
          ) : (
            balances.map((b) => (
              <View
                key={b.id}
                className="bg-paper-50 rounded-2xl border border-ink-100 p-4 mb-3 flex-row flex-wrap items-center gap-x-3 gap-y-2"
              >
                <View className="flex-1 min-w-[140px]">
                  <StyledText variant="extrabold" className="text-ink-900 text-sm">
                    {b.name}
                  </StyledText>
                  <StyledText variant="regular" className="text-ink-600 text-xs mt-0.5">
                    {t('emptiesDepositEach', { amount: formatPesos(b.depositPesos) })}
                  </StyledText>
                </View>
                <View className="items-end">
                  <StyledText
                    variant="black"
                    className="text-ink-900 text-base"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {t('emptiesOwed', { count: b.owed })}
                  </StyledText>
                  <StyledText
                    variant="semibold"
                    className="text-cinnamon-600 text-xs"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {t('emptiesAtRisk', { amount: formatPesos(b.pesosAtRisk) })}
                  </StyledText>
                </View>
                <Btn label={t('emptiesCountSwap')} primary onPress={() => openSwap(b)} />
              </View>
            ))
          )}
          <Btn
            label={t('emptiesAddType')}
            onPress={() => {
              setName('');
              setDeposit('');
              setSheet('type');
            }}
          />
        </ScrollView>
      )}

      <Sheet
        visible={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet === 'swap' ? `${t('emptiesCountSwap')}: ${target?.name ?? ''}` : t('emptiesAddType')}
      >
        {sheet === 'type' ? (
          <>
            <Field label={t('emptiesTypeName')} value={name} onChangeText={setName} numeric={false} />
            <Field label={t('emptiesDeposit')} value={deposit} onChangeText={(v) => setDeposit(digits(v))} />
          </>
        ) : (
          <>
            <Field label={t('emptiesFullReceived')} value={full} onChangeText={(v) => setFull(digits(v))} />
            <Field label={t('emptiesHandedBack')} value={back} onChangeText={(v) => setBack(digits(v))} />
            <Field label={t('emptiesHeld')} value={held} onChangeText={(v) => setHeld(digits(v))} />
            {preview ? (
              <StyledText
                variant="semibold"
                accessibilityLiveRegion="polite"
                className={`text-sm ${preview.shortfall > 0 ? 'text-semantic-danger' : 'text-ink-700'}`}
              >
                {preview.shortfall > 0
                  ? t('emptiesShort', { count: preview.shortfall, amount: formatPesos(preview.shortfallPesos) })
                  : t('emptiesNoShort', { count: preview.expectedOwed })}
              </StyledText>
            ) : null}
          </>
        )}
        <View className="flex-row gap-x-3">
          <Btn label={t('cancel')} onPress={() => setSheet(null)} />
          <Btn
            label={t('save')}
            primary
            disabled={sheet === 'type' ? name.trim() === '' : input === null}
            onPress={sheet === 'type' ? () => void saveType() : saveSwap}
          />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  numeric = true,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  numeric?: boolean;
}) {
  return (
    <View className="gap-y-1">
      <StyledText variant="semibold" className="text-ink-900 text-sm">
        {label}
      </StyledText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={numeric ? 'number-pad' : 'default'}
        placeholderTextColor={ICON_COLOR.inkMuted}
        accessibilityLabel={label}
        className={INPUT}
      />
    </View>
  );
}

function Btn({
  label,
  primary = false,
  disabled = false,
  onPress,
}: {
  label: string;
  primary?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  // Light text needs persimmon-600 or darker (DESIGN.md Fill Contrast Rule).
  const surface = disabled ? 'bg-paper-300' : primary ? 'bg-persimmon-600' : 'border border-ink-200 bg-paper-100';
  const text = disabled ? 'text-ink-500' : primary ? 'text-paper-50' : 'text-ink-800';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      className={`flex-1 min-w-[140px] min-h-[48px] px-3 rounded-xl items-center justify-center active:opacity-80 ${surface}`}
    >
      <StyledText variant="extrabold" className={`text-sm text-center ${text}`}>
        {label}
      </StyledText>
    </Pressable>
  );
}

export default withProf(SupplierEmpties, 'supplier-empties/[supplierId]');
