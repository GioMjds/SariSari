import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { NewCredit, Product } from '@/types';
import { parsePesosInput, tryParsePesosInput } from '@/lib/money';
import { useCredits, useProducts } from '@/hooks';

export interface CreditFormData {
  productName: string;
  quantity: string;
  amount: string;
  dueDate: string;
  notes: string;
}

export interface TicketItem {
  id: string;
  product_id?: number;
  product_name: string;
  quantity: number;
  amount: number;
  unitPrice: number;
}

export type DuePreset = 'none' | '1w' | '2w' | '1m';

export interface DuePresetConfig {
  id: DuePreset;
  label: string;
  description: string;
  /** Returns the YYYY-MM-DD value for this preset, evaluated lazily. */
  resolve: () => string;
}

/** Add N days to now and return as YYYY-MM-DD in local time. */
export function addDaysIso(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Format a YYYY-MM-DD string into "Mon DD" for chip display. */
export function formatDueChip(iso: string): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const DUE_PRESETS: DuePresetConfig[] = [
  {
    id: 'none',
    label: 'No Limit',
    description: 'Open-ended',
    resolve: () => '',
  },
  {
    id: '1w',
    label: '1 Wk',
    description: '7 days',
    resolve: () => addDaysIso(7),
  },
  {
    id: '2w',
    label: '2 Wks',
    description: '14 days',
    resolve: () => addDaysIso(14),
  },
  {
    id: '1m',
    label: '1 Mo',
    description: '30 days',
    resolve: () => addDaysIso(30),
  },
];

/**
 * useAddCreditForm — owns the Add Credit screen's form state.
 *
 * Encapsulates react-hook-form setup, the product-selection state,
 * the quantity stepper, the due-date preset selection, and the submit
 * pipeline that posts to `useInsertCredit` and triggers the toast.
 *
 * The screen and its components stay presentational; this hook is the
 * single place where business logic lives.
 */
export function useAddCreditForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { useCustomer, useInsertCredit } = useCredits();
  const { getAllProductsQuery } = useProducts();

  // Local UI state — product picker, due-date preset selection, and ticket items list.
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuery, setProductQuery] = useState<string>('');
  const [productDropdownOpen, setProductDropdownOpen] =
    useState<boolean>(false);
  const [duePreset, setDuePreset] = useState<DuePreset>('none');
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([]);

  // react-hook-form setup with the field defaults that match the
  // original screen.
  const { control, handleSubmit, setValue, watch, reset } =
    useForm<CreditFormData>({
      defaultValues: {
        productName: '',
        quantity: '1',
        amount: '',
        dueDate: '',
        notes: '',
      },
    });

  const quantity = watch('quantity');
  const amount = watch('amount');
  const productName = watch('productName');
  const dueDate = watch('dueDate');

  // Customer + product list from the query cache.
  const { data: customer } = useCustomer(Number(id));
  const { data: products = [] } = getAllProductsQuery;

  // Refetch on focus so prices and stock are fresh when the user opens
  // this sheet from a customer profile.
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }, [queryClient, id]),
  );

  const insertCredit = useInsertCredit();

  // ─── Handlers ────────────────────────────────────────────────────

  const handleProductSelect = useCallback(
    (product: Product) => {
      setSelectedProduct(product);
      setValue('productName', product.name);
      setValue('amount', product.price.toString());
      setProductQuery(product.name);
      setProductDropdownOpen(false);
    },
    [setValue],
  );

  const handleProductNameChange = useCallback(
    (text: string) => {
      setValue('productName', text);
      setProductQuery(text);
      // Unlock the locked unit price when the user manually edits
      // the product name away from the picked product.
      setSelectedProduct((current) =>
        current && text !== current.name ? null : current,
      );
      setProductDropdownOpen(true);
    },
    [setValue],
  );

  const clearProduct = useCallback(() => {
    setValue('productName', '');
    setProductQuery('');
    setSelectedProduct(null);
    setProductDropdownOpen(false);
  }, [setValue]);

  const bumpQuantity = useCallback(
    (delta: number) => {
      const current = parseInt(quantity, 10);
      const next = Math.max(1, Number.isFinite(current) ? current + delta : 1);
      setValue('quantity', String(next));
    },
    [quantity, setValue],
  );

  const handlePresetSelect = useCallback(
    (preset: DuePresetConfig) => {
      setDuePreset(preset.id);
      setValue('dueDate', preset.resolve());
    },
    [setValue],
  );

  const addCurrentToTicket = useCallback(() => {
    if (!productName?.trim() || !amount) return;

    const qty = quantity ? parseInt(quantity, 10) : 1;
    const price = tryParsePesosInput(amount);
    const itemTotal = qty * price;

    setTicketItems((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        product_id: selectedProduct?.id || undefined,
        product_name: selectedProduct ? selectedProduct.name : productName.trim(),
        quantity: qty,
        amount: itemTotal,
        unitPrice: price,
      },
    ]);

    // Reset draft fields
    setValue('productName', '');
    setValue('quantity', '1');
    setValue('amount', '');
    setSelectedProduct(null);
    setProductQuery('');
  }, [productName, amount, quantity, selectedProduct, setValue]);

  const removeTicketItem = useCallback((itemId: string) => {
    setTicketItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const submit = handleSubmit((data) => {
    const credits: NewCredit[] = ticketItems.map((item) => ({
      customer_id: Number(id),
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      amount: item.amount,
      due_date: data.dueDate?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    }));

    // If there is currently a draft item filled out, include it in the submit
    if (productName?.trim() && amount) {
      credits.push({
        customer_id: Number(id),
        product_id: selectedProduct?.id || undefined,
        product_name: selectedProduct ? selectedProduct.name : productName.trim(),
        quantity: quantity ? parseInt(quantity, 10) : undefined,
        amount: qtyNum * tryParsePesosInput(amount),
        due_date: data.dueDate?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      });
    }

    if (credits.length === 0) return;
    insertCredit.mutate(credits);
  });

  // ─── Derived values for the UI ──────────────────────────────────

  const qtyNum = quantity ? parseInt(quantity, 10) : 1;
  const unitPrice = amount ? tryParsePesosInput(amount) : 0;
  const draftTotal = qtyNum * unitPrice;
  const itemsTotal = ticketItems.reduce((sum, item) => sum + item.amount, 0);
  const total = itemsTotal + (productName?.trim() && amount ? draftTotal : 0);
  
  const dueChipLabel = formatDueChip(dueDate);
  const isSubmitDisabled =
    insertCredit.isPending ||
    (ticketItems.length === 0 && (!productName?.trim() || !amount));

  const itemCount = ticketItems.length + (productName?.trim() && amount ? 1 : 0);

  return {
    // Form wiring (passed through to the ticket sheet / RHF controllers)
    control,
    handleSubmit,
    setValue,
    watch,
    reset,

    // Watched values
    quantity,
    amount,
    productName,
    dueDate,

    // Local state
    selectedProduct,
    productQuery,
    productDropdownOpen,
    setProductDropdownOpen,
    duePreset,
    ticketItems,

    // Handlers
    handleProductSelect,
    handleProductNameChange,
    clearProduct,
    bumpQuantity,
    handlePresetSelect,
    addCurrentToTicket,
    removeTicketItem,
    submit,

    // Mutation state
    insertCredit,

    // Domain data
    customer,
    products,

    // Derived
    qtyNum,
    unitPrice,
    total,
    dueChipLabel,
    isSubmitDisabled,
    itemCount,

    // Router (exposed for the back button)
    router,
  };
}
