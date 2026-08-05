# Future Feature Roadmap

Each item below is a short pointer to a detailed brief. Read the
brief before scoping work; the brief captures the problem, scope,
data implications, dependencies, open questions, and feasibility
notes that the one-liner below does not.

## Now — highest daily value

1. [POS fast lane](01-pos-fast-lane.md) — favorites, recently
   sold items, common quantities, faster search, and barcode
   scanning.
2. [Parked sales](02-parked-sales.md) — set aside one customer's
   cart and resume it later without losing items.
3. [Daily cash close-out](03-daily-cash-close-out.md) — record
   opening cash, cash in/out, counted cash, expected cash, and
   the variance with a reason.
4. [Physical stocktake](04-physical-stocktake.md) — guided count
   by category, variance review, and reason-coded inventory
   adjustments.
5. [Utang guardrails at checkout](05-utang-guardrails-at-checkout.md) —
   show live balance, available credit, overdue status, and
   enforce the suki's limit or require an owner override.
6. [Collection queue](06-collection-queue.md) — a clear list of
   overdue and near-limit suki, with one-tap partial/full payment
   recording and an optional local follow-up date.

## Next — strengthen control and replenishment

7. [Safe voids, refunds, and corrections](07-safe-voids-refunds-corrections.md) —
   reverse a sale through an auditable workflow that restores
   stock and correctly adjusts cash or utang.
8. [Supplier delivery receiving](08-supplier-delivery-receiving.md) —
   record delivered quantities, actual purchase costs, shortages,
   and supplier invoices when restocking.
9. [Offline reorder suggestions](09-offline-reorder-suggestions.md) —
   create a supplier-grouped shopping list from low stock, sales
   history, and target stock levels; the owner always confirms
   it.
10. [Stock movement timeline](10-stock-movement-timeline.md) — a
    simple "why did this quantity change?" view across sales,
    restocks, spoilage, returns, and manual adjustments.
11. [Owner PIN for sensitive actions](11-owner-pin-for-sensitive-actions.md) —
    protect price overrides, large discounts, voids, stock
    adjustments, and debt-limit exceptions on the shared device.
12. [Customer credit statements](12-customer-credit-statements.md) —
    generate an offline receipt or PDF statement showing
    purchases, payments, and remaining utang.

## Later — useful once the fundamentals are reliable

13. [Expiry and damaged-goods tracking](13-expiry-and-damaged-goods-tracking.md) —
    only for products where it matters, with near-expiry and
    write-off reasons to make losses visible.
14. [Transparent local store insights](14-transparent-local-store-insights.md) —
    practical tips derived solely from on-device history: items
    that repeatedly stock out, dead stock, margin changes, and
    suki payment patterns.
15. [Smarter but explainable credit profiles](15-smarter-but-explainable-credit-profiles.md) —
    suggest — not silently decide — credit limits from payment
    timeliness, balance, and overdue history. Builds on the
    README's planned risk/payer profiles.
16. [Shift tracking on one device](16-shift-tracking-on-one-device.md) —
    local cashier profiles or shift handovers so cash variances
    and corrections have attribution without introducing
    multi-device accounts.
17. [Manual encrypted backup and restore](17-manual-encrypted-backup-and-restore.md) —
    export/import the SQLite data through the device's Files /
    share flow. No cloud account or automatic syncing required.
18. [Offline price-label and barcode sheets](18-offline-price-label-and-barcode-sheets.md) —
    generate printable labels from the existing catalog for
    shelves and repacked tingi items.
