# Design Document: Sell Tab Redesign (Dual-Tab Segmented Flow)

## Objective

Redesign the **Sell** tab (`app/(tabs)/sell/index.tsx`) to implement a direct, offline-first Point-of-Sale (POS) workflow using a segmented top-tab layout ("New Sale" vs. "History"). This solves the visual/UX confusion surrounding the floating "+" action button (FAB) by making the checkout screen the default state while preserving the entirety of the existing history list, statistics slip, and filter controls.

## The Problem

1. **Disconnected Counter Flow**: Currently, the Sell tab functions solely as a transaction list ("Resibo Book"). Adding a new sale requires tapping a small, floating "+" button, which routes to a separate form modal (`app/(edit-forms)/add-sales/index.tsx`). This adds unnecessary navigation latency and friction to the store owner's primary action.
2. **FAB Obscurity**: Store owners, especially those using the app offline on varying phone sizes, often miss or are confused by floating action buttons.
3. **Redundant Form Routing**: Having the main POS action live behind a secondary modal route creates a disconnected navigation stack.

## Proposed Solution (Option A: Segmented Control)

We will introduce a top tab selector (segmented control) inside `app/(tabs)/sell/index.tsx`.

1. **Dual-View Segments**:
   - **"New Sale" (Active POS)**: The default screen state. Displays product search and quick-add grid, along with the cart bubble and checkout logic. This directly integrates the UX from `app/(edit-forms)/add-sales/index.tsx`.
   - **"History" (Resibo Book)**: Displays the current sales history view—retaining the "Today's Slip" card, filter chips, list of sales rows, filter modal, and pagination.
2. **Clean Transition**:
   - Tapping the bottom "Sell" tab lands the user directly on "New Sale", ready to add items immediately.
   - The floating "+" FAB is removed from both views since it is now obsolete.
   - The route `app/(edit-forms)/add-sales` is deprecated. Any navigation links to it (e.g., from empty states) will be redirected to route `/(tabs)/sell` with the segment set to `new-sale`.
3. **Preserving UI Integrity**:
   - The list row layouts, "Today's Slip" summary card, filter behavior, and money formatting (integer centavos rule) are preserved exactly as they are.

---

## Technical Specifications

### 1. State Management in `app/(tabs)/sell/index.tsx`

We will track the active segment using React state, initialized by optional search parameters for deep-linking:

```typescript
const { tab: initialTabParam } = useLocalSearchParams<{ tab?: string }>();
const [activeTab, setActiveTab] = useState<'new-sale' | 'history'>('new-sale');

// Sync URL param if navigated from external source
useEffect(() => {
  if (initialTabParam === 'history') {
    setActiveTab('history');
  } else if (initialTabParam === 'new-sale') {
    setActiveTab('new-sale');
  }
}, [initialTabParam]);
```

### 2. Header and Segment Segmented Selector Layout

We will place a segmented controller directly underneath the header title area in the top cinnamon header block:

```tsx
<View className="bg-cinnamon-500 px-5 pt-3 pb-4">
  {/* Existing header monogram + title */}
  <View className="flex-row items-center justify-between mb-4">
    <View className="flex-row items-center">
      <View className="w-8 h-8 rounded-full bg-persimmon-500 items-center justify-center mr-2">
        <StyledText variant="black" className="text-paper-50 text-xl">
          ₱
        </StyledText>
      </View>
      <StyledText
        variant="extrabold"
        className="label-caps text-paper-200 opacity-80"
      >
        Resibo Book
      </StyledText>
    </View>

    {/* Filter trigger button is only displayed in History view */}
    {activeTab === 'history' && (
      <Pressable
        hitSlop={12}
        onPress={() => setFilterModalVisible(true)}
        className="relative w-11 h-11 rounded-full items-center justify-center bg-paper-50/15"
      >
        <FontAwesome name="sliders" size={18} color="#FBF7EE" />
      </Pressable>
    )}
  </View>

  {/* Segment Switcher */}
  <View className="flex-row bg-cinnamon-600/30 p-1 rounded-xl">
    <TouchableOpacity
      onPress={() => setActiveTab('new-sale')}
      className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'new-sale' ? 'bg-persimmon-500' : ''}`}
    >
      <StyledText variant="bold" className="text-paper-50 text-sm">
        New Sale
      </StyledText>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => setActiveTab('history')}
      className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'history' ? 'bg-persimmon-500' : ''}`}
    >
      <StyledText variant="bold" className="text-paper-50 text-sm">
        History
      </StyledText>
    </TouchableOpacity>
  </View>
</View>
```

### 3. Merging View Contents

We will split the layout body of the screen based on `activeTab`:

- **If `new-sale`**: Render the POS search box, product selection lists, floating checkout cart bubble, and checkout modal logic.
- **If `history`**: Render the stats hero block, filter chips row, paginated sales transactions list, and pagination selector.

All database queries/mutations (`useSales`, `useProducts`, `useCustomers`) will remain cleanly bound via TanStack query hooks as specified by the Layering Rule.

---

## Verification & Testing Plan

1. **User Workflow Verification**:
   - Land on `/(tabs)/sell` -> Verify "New Sale" loads default product catalog list.
   - Search a product -> Verify query filters catalog.
   - Tap item -> Verify added to cart, quantity count increases.
   - Press Cart -> Verify Checkout modal appears.
   - Complete Sale (Cash or Credit) -> Verify stock decreases in DB and sale transaction displays instantly in the "History" tab list.
2. **History Verification**:
   - Tap "History" tab -> Verify "Today's Slip" amounts update accurately.
   - Apply filters (e.g., date, payment type) -> Verify list filtering works.
3. **Hard Offline-First Rule**:
   - Turn off Wi-Fi/cellular and perform checkout flow. Ensure it completes instantly with zero network timeouts.
4. **Centavos Integrity Rule**:
   - Ensure all prices are shown using the custom `<MoneyText>` component with the `fromPesos` prop mapping integers correctly (e.g. 1500 -> ₱15.00).
5. **Linting and Testing**:
   - Run `npx expo lint` and `pnpm test`.
