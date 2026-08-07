# Design Specification: Product Form Unification

## Context
The product creation (`/add-product`) and product editing (`/edit-product`) screens previously diverged in both UI design language and feature set. `/edit-product` lacked barcode editing, camera barcode scanning, stock level visibility, quick markup presets, bundle cost calculations, and shared uniform card styling. Furthermore, `/add-product` contained a non-functional supplier selector touchable without a modal handler, while `/edit-product` threw an unhandled exception when cost exceeded selling price.

This specification unifies the design, components, and form logic across both routes.

## Architecture & Shared Components

All shared product form UI components will be housed under `components/inventory/products/form/`:

1. `ProductBasicInfoCard.tsx`:
   - Renders product image picker, product name input, SKU (auto-generate toggle for add mode; read-only lock tag for edit mode), barcode field with scan button and duplicate collision alert, category horizontal scroll pills, and working supplier picker modal.
   - Props: `mode: 'add' | 'edit'`, form control, categories, supplier list, barcode handlers, scanner modal triggers.

2. `ProductPricingCard.tsx`:
   - Renders cost price input, Single / Bundle cost pricing mode toggle (with total bundle cost and pieces-per-bundle inputs), quick markup preset chips (`+10%`, `+20%`, `+30%`, `+50%`), selling price input, loss warning banner, Profit Receipt card, and Pakyaw (wholesale) tier section.
   - Props: form control, cost/price state, markup handlers, wholesale toggle and unit inputs.

3. `ProductStockCard.tsx`:
   - Renders stock quantity input with quick increment chips (`+5`, `+10`, `+20`).
   - In edit mode, displays current quantity and allows restocking or inventory adjustment.

4. `ProductFormActionButtons.tsx`:
   - Primary action button (`rounded-2xl`, persimmon background with brand glow shadow & loading state) and secondary parchment Cancel button.

5. `ProductFormHeader.tsx`:
   - Standardized header bar with paper circular back button, title, and subtitle.

## Form Hooks & State Logic Alignment

1. `useAddProductForm.ts`:
   - Connects to shared form cards.
   - Retains current insertion mutation logic and barcode catalog auto-fill.

2. `useEditProductForm.ts`:
   - Updated to support barcode viewing/editing, barcode duplicate check, and `BarcodeScannerModal` trigger.
   - Added bundle pricing mode calculation and quick markup preset application.
   - Replaced raw `throw new Error` on submission when cost >= price with a non-blocking `isLossWarning` flag and banner.

## Screen Routes Layout

Both `app/(edit-forms)/add-product/index.tsx` and `app/(edit-forms)/edit-product/[id].tsx` will follow the exact layout structure:

```tsx
<SafeAreaView className="flex-1 bg-background" edges={['top']}>
  <StatusBar style={form.isScannerOpen ? 'light' : 'dark'} />
  <KeyboardAwareScrollView
    className="flex-1"
    showsVerticalScrollIndicator={false}
    enableAutomaticScroll
    enableOnAndroid
    extraScrollHeight={Platform.OS === 'ios' ? 120 : 100}
    keyboardShouldPersistTaps="handled"
    contentContainerStyle={{ paddingBottom: 40 }}
  >
    <ProductFormHeader title={isEdit ? "Edit Product" : "Add Product"} onBack={form.handleBack} />

    <View className="px-4">
      <ProductBasicInfoCard mode={mode} ... />

      <View className="my-3 border-t border-dashed border-ink-300" />

      <ProductPricingCard mode={mode} ... />

      <View className="my-3 border-t border-dashed border-ink-300" />

      <ProductStockCard mode={mode} ... />

      {/* Edit mode only metadata & danger zone */}
      {isEdit && (
        <>
          <View className="my-3 border-t border-dashed border-ink-300" />
          <ProductMetaCard createdAt={product.created_at} updatedAt={product.updated_at} />
          <View className="mt-6 mb-2">
            <EditDangerZone onDelete={form.openDeleteModal} />
          </View>
        </>
      )}

      <ProductFormActionButtons
        submitLabel={isEdit ? "Save Changes" : "Add Product"}
        disabled={form.isSubmitDisabled}
        isPending={form.isPending}
        onSubmit={form.submit}
        onCancel={form.handleBack}
      />
    </View>
  </KeyboardAwareScrollView>

  <Modal ... /> {/* Unsaved changes discard modal */}
  {isEdit && <Modal ... />} {/* Delete product confirmation modal */}
  <BarcodeScannerModal ... />
</SafeAreaView>
```

## Verification Plan

1. Verify TypeScript compilation (`npm run typecheck`).
2. Run Jest unit tests (`npm test`).
3. Verify `/add-product` and `/edit-product/[id]` render with identical design tokens, dashed section dividers, barcode tools, quick markups, and working supplier pickers.
