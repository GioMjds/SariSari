import { useMemo } from 'react';
import { useCategories } from '@/hooks';
import { useAddCategorySheet } from '@/stores';
import { CategoryFormSheet } from './CategoryFormSheet';

/** App-wide add form; mounted once in InventoryModalsHost and opened through useAddCategorySheet. */
export function AddCategorySheet() {
  const open = useAddCategorySheet((s) => s.open);
  const hide = useAddCategorySheet((s) => s.hide);
  const { getAllCategoriesQuery, insertCategoryMutation } = useCategories();

  const takenNames = useMemo(
    () =>
      (getAllCategoriesQuery.data ?? []).map((c) => c.name.trim().toLowerCase()),
    [getAllCategoriesQuery.data],
  );

  return (
    <CategoryFormSheet
      visible={open}
      mode="add"
      initialName=""
      takenNames={takenNames}
      saving={insertCategoryMutation.isPending}
      onSubmit={(name) => insertCategoryMutation.mutate({ name }, { onSuccess: hide })}
      onClose={hide}
    />
  );
}
