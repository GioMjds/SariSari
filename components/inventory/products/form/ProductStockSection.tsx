import { type ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { type Control, useController, useWatch } from 'react-hook-form';
import { StyledText } from '@/components/elements';
import { StockBadge } from '@/components/ui';
import { QuantityStepper } from '../../modals/_shared/QuantityStepper';
import { SectionCard } from './FormPrimitives';
import { STOCK_PRESETS, type ProductFormData } from './types';

type ProductStockSectionProps =
  | { mode: 'add'; control: Control<ProductFormData> }
  | {
      mode: 'edit';
      control: Control<ProductFormData>;
      quantity: number;
      onRestock: () => void;
      onAdjust: () => void;
    };

/** Add sets the opening count; Edit shows live stock and routes changes through logged movements. */
export function ProductStockSection(props: ProductStockSectionProps) {
  const unit = useWatch({ control: props.control, name: 'retailUnitName' }) || 'Pc';
  return props.mode === 'add' ? (
    <AddStock control={props.control} unit={unit} />
  ) : (
    <SectionCard
      title="Stock"
      hint="Changes here are logged in Stock Movements"
      aside={<StockBadge quantity={props.quantity} />}
    >
      <View className="flex-row items-baseline">
        <StyledText
          variant="extrabold"
          className="text-ink-900 text-4xl"
          style={{ fontVariant: ['tabular-nums'] }}
          accessibilityLabel={`${props.quantity} ${unit} on hand`}
        >
          {props.quantity}
        </StyledText>
        <StyledText variant="medium" className="text-ink-500 text-sm ml-2">
          {`${unit} on hand`}
        </StyledText>
      </View>
      <View className="flex-row gap-x-3">
        <StockAction icon="truck" label="Restock" onPress={props.onRestock} primary />
        <StockAction icon="sliders" label="Adjust count" onPress={props.onAdjust} />
      </View>
    </SectionCard>
  );
}

function AddStock({ control, unit }: { control: Control<ProductFormData>; unit: string }) {
  const { field } = useController({ control, name: 'initialStock' });
  const qty = parseInt(field.value || '0', 10) || 0;
  const set = (n: number) => field.onChange(String(Math.max(0, n)));

  return (
    <SectionCard title="Opening stock" hint={`How many ${unit} are on the shelf now`}>
      <QuantityStepper value={qty} onChange={set} min={0} />
      <View className="flex-row gap-x-2">
        {STOCK_PRESETS.map((preset) => (
          <Pressable
            key={preset}
            onPress={() => set(qty + preset)}
            accessibilityRole="button"
            accessibilityLabel={`Add ${preset} to stock`}
            className="flex-1 min-h-[44px] rounded-xl bg-paper-100 border border-paper-300 items-center justify-center active:bg-paper-200"
          >
            <StyledText variant="extrabold" className="text-ink-900 text-sm">
              {`+${preset}`}
            </StyledText>
          </Pressable>
        ))}
      </View>
      <StyledText variant="regular" className="text-ink-500 text-xs">
        Leave at 0 if you will restock later.
      </StyledText>
    </SectionCard>
  );
}

function StockAction({
  icon,
  label,
  onPress,
  primary,
}: {
  icon: ComponentProps<typeof FontAwesome>['name'];
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`flex-1 min-h-[48px] rounded-xl flex-row items-center justify-center border ${
        primary
          ? 'bg-cinnamon-500 border-cinnamon-500 active:bg-cinnamon-600'
          : 'bg-paper-100 border-paper-300 active:bg-paper-200'
      }`}
    >
      <FontAwesome name={icon} size={14} color={primary ? '#FAFAF7' : '#28231D'} />
      <StyledText
        variant="semibold"
        className={`text-sm ml-2 ${primary ? 'text-paper-50' : 'text-ink-700'}`}
      >
        {label}
      </StyledText>
    </Pressable>
  );
}
