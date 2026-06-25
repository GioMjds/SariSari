import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { formatPesos } from '@/lib/money';
import { Product } from '@/types';
import { CreditFormData, DuePreset, DuePresetConfig, TicketItem } from './useAddCreditForm';
import { Control } from 'react-hook-form';
import { ProductPicker } from './ProductPicker';
import { QtyPriceStepper } from './QtyPriceStepper';
import { DueDateChips } from './DueDateChips';
import { NotesField } from './NotesField';
import { GrandTotalCard } from './GrandTotalCard';
import { StyledText } from '@/components/elements';

interface CreditTicketSheetProps {
  control: Control<CreditFormData>;
  quantity: string;
  amount: string;
  dueDate: string;
  productName: string;
  selectedProduct: Product | null;
  productDropdownOpen: boolean;
  setProductDropdownOpen: (open: boolean) => void;
  duePreset: DuePreset;
  productSuggestions: Product[];
  qtyNum: number;
  unitPrice: number;
  total: number;
  ticketItems: TicketItem[];
  itemCount: number;
  onProductSelect: (product: Product) => void;
  onProductNameChange: (text: string) => void;
  onBumpQuantity: (delta: number) => void;
  onPresetSelect: (preset: DuePresetConfig) => void;
  onClearProduct: () => void;
  onAddItemToTicket: () => void;
  onRemoveItemFromTicket: (id: string) => void;
}

/**
 * CreditTicketSheet — the cream ticket wrapper that composes
 * ProductPicker + QtyPriceStepper + DueDateChips + NotesField +
 * GrandTotalCard, separated by dashed dividers. Pure presentation;
 * every value and handler is supplied by the screen from
 * `useAddCreditForm`.
 */
export function CreditTicketSheet({
  control,
  quantity,
  amount,
  dueDate,
  productName,
  selectedProduct,
  productDropdownOpen,
  setProductDropdownOpen,
  duePreset,
  productSuggestions,
  qtyNum,
  unitPrice,
  total,
  ticketItems,
  itemCount,
  onProductSelect,
  onProductNameChange,
  onBumpQuantity,
  onPresetSelect,
  onClearProduct,
  onAddItemToTicket,
  onRemoveItemFromTicket,
}: CreditTicketSheetProps) {
  return (
    <View className="bg-paper-50 rounded-3xl shadow-paper border border-ink-100 p-4 paper-texture overflow-hidden">
      <ProductPicker
        value={productName}
        suggestions={productSuggestions}
        selectedProduct={selectedProduct}
        dropdownOpen={productDropdownOpen}
        onDropdownOpenChange={setProductDropdownOpen}
        onChangeText={onProductNameChange}
        onSelect={onProductSelect}
        onClear={onClearProduct}
      />

      <View className="my-4 border-t border-dashed border-ink-200" />

      <QtyPriceStepper
        qty={quantity}
        qtyNum={qtyNum}
        control={control}
        onBump={onBumpQuantity}
      />

      {/* Add to Ticket Button */}
      {!!productName && !!amount && (
        <View className="mt-3">
          <Pressable
            onPress={onAddItemToTicket}
            className="w-full bg-paper-100 border border-ink-200 rounded-xl py-2.5 items-center justify-center flex-row"
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.98 : 1 }],
              backgroundColor: pressed ? '#EFE6D2' : '#F6F0E2',
            })}
          >
            <FontAwesome name="plus" size={12} color="#7A7165" />
            <StyledText variant="semibold" className="text-ink-700 text-sm ml-2">
              Add to Ticket
            </StyledText>
          </Pressable>
        </View>
      )}

      {/* Ticket Items List */}
      {ticketItems.length > 0 && (
        <>
          <View className="my-4 border-t border-dashed border-ink-200" />
          <View>
            <StyledText variant="black" className="label-caps text-ink-700 mb-2">
              Ticket Items
            </StyledText>
            <View className="bg-paper-100 rounded-2xl border border-ink-100 p-3">
              {ticketItems.map((item, index) => (
                <View key={item.id}>
                  {index > 0 && (
                    <View className="border-t border-dashed border-ink-200 my-2.5" />
                  )}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-2">
                      <StyledText variant="extrabold" className="text-ink-900 text-sm">
                        {item.product_name}
                      </StyledText>
                      <StyledText variant="medium" className="text-ink-500 text-xs mt-0.5">
                        {item.quantity} × {formatPesos(item.unitPrice)}
                      </StyledText>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <StyledText variant="extrabold" className="text-ink-900 text-sm">
                        {formatPesos(item.amount)}
                      </StyledText>
                      <Pressable
                        onPress={() => onRemoveItemFromTicket(item.id)}
                        hitSlop={8}
                        className="w-8 h-8 items-center justify-center rounded-full bg-semantic-danger-50"
                        style={({ pressed }) => ({
                          backgroundColor: pressed ? '#FAD8D8' : '#FDECEC',
                        })}
                      >
                        <FontAwesome name="trash" size={14} color="#C13030" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      <View className="my-4 border-t border-dashed border-ink-200" />

      <DueDateChips
        dueDate={dueDate}
        activePreset={duePreset}
        onPresetSelect={onPresetSelect}
      />

      <View className="my-4 border-t border-dashed border-ink-200" />

      <NotesField control={control} />

      <View className="my-4 border-t border-dashed border-ink-200" />

      <GrandTotalCard qty={qtyNum} unitPrice={unitPrice} total={total} itemCount={itemCount} />
    </View>
  );
}
