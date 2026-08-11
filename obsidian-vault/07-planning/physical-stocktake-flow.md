# Physical Stocktake Flow

> **Parent Index**: [[planning|07-Planning Index]]  
> **Master Feature Spec**: [[02-Features/04-physical-stocktake|04-Physical Stocktake]]  
> **Related Specs**: [[02-Features/10-stock-movement-timeline|10-Stock Movement Timeline]] | [[02-Features/08-supplier-delivery-receiving|08-Supplier Delivery Receiving]]

Detailed operational breakdown for guided category-by-category physical stock counting, variance calculation, and inventory adjustment.

---

## Work Breakdown

### Main Flow (Baseline)

1. **Start Stocktake** – Owner taps “Start Stocktake” from the Inventory tab. The app snapshots current product quantities (expected Qty) and creates an in-progress session.
2. **Category-by-Category Counting** – Products are grouped by category. For each product the owner enters the counted quantity (numeric keypad or quick-chips). The screen shows live progress (counted / total).
3. **Variance Review** – After all products are counted, the app navigates to a variance screen listing only items where `counted ≠ expected`. For each line the owner selects a reason code (shrinkage, spoilage, miscount, gift, etc.) and may add a note.
4. **Commit or Abandon** –   
   - *Commit*: All variance lines are written as adjustment transactions (`type='adjustment'`) inside a DB transaction, product quantities are updated, and the session is marked completed.   
   - *Abandon*: The session is marked abandoned; no changes are made to inventory.
5. **Summary & History** – A toast shows the net peso impact and the owner can view past stocktake sessions from the history list.

### Scheduling & Reminders (Optional Setting)

- **Frequency Preference** – In Settings → Inventory → Stocktake Schedule, the owner can choose a recurrence (None, Daily, Weekly, Bi-weekly, Monthly) and a preferred time of day.
- **Local Notification** – When the configured time arrives, the app posts a local notification (“Time for your weekly stocktake”). Tapping the notification opens the Stocktake screen directly. Connected Note: [[07-Planning/notification-contents|Notification Contents]].
- **Snooze / Dismiss** – The notification offers a “Snooze 1 hour” action and a “Dismiss” action. Snoozed notifications reschedule the reminder.
- **Badge Indicator** – The Inventory tab badge shows a count of overdue scheduled stocktakes (based on the last completed session vs. the chosen interval).
- **Persistence** – Schedule settings are stored in `AsyncStorage` (or a simple table) and survive app restarts.

### Additional Workflow Enhancements (Optional / Situational)

| Feature | Description | How to Enable |
|---------|-------------|---------------|
| Quick-quantity chips | Buttons for +1, +5, +10, “case”, “dozen” alongside the numeric input to speed bulk counting. | Toggle in Settings → Stocktake → Show quick chips (default off). |
| Barcode-assisted entry | Scan a product barcode to auto-focus its count field, reducing manual selection. | Requires camera permission; toggle in Settings → Stocktake → Enable barcode scan. |
| Pause / Resume Across Sessions | If the app is backgrounded or the device reboots while a session is in progress, the counting view is restored automatically on relaunch. | No extra UI needed; handled by checking for an `in_progress` session on app start. |
| Subset Stocktake | Allows the owner to run a stocktake on a selected category or a custom product list (e.g., high-value items). | Before starting, a modal lets the owner pick categories; only those products are pre-populated. |
| Export Variance Report | After committing, a “Share Report” button generates a CSV (or PDF) of the variance lines, reasons, and notes, then invokes the system share sheet. | Always available after a successful commit. |
| Stronger Conflict Guard | While a stocktake is active, mutations that would modify product quantities (sales, adjustments, purchases) are blocked and show a toast explaining the active stocktake. | Implemented by checking the `useStocktakeGuard.isActive` flag in relevant hooks; can be toggled in Settings → Advanced → Guard stocktake. |
| Reason Code Customization | Store owners can edit the list of reason codes (add/delete/rename) to match local terminology. | Settings → Stocktake → Reason codes (stored in a simple table). |
| Audio Confirmation | Optional short sound when a count is saved, providing tactile feedback without looking at the screen. | Settings → Stocktake → Enable audio feedback. |

### User Feedback & Metrics (Planned)

- After each completed stocktake, a short in-app survey asks: “Was the stocktake easy to complete?” (Likert 1-5) and “Anything missing?” (free text). Responses are stored locally and can be exported via Settings → Support → Send feedback.
- The app logs (anonymously) the average time to complete a stocktake and the variance rate to help prioritize future improvements.

### Open Questions (for Future Refinement)

- Should the app automatically suggest a stocktake date based on historic variance trends?
- Would integrating with a Bluetooth scale for bulk items improve speed for certain product types?
- Should completed stocktake snapshots be stored for long-term trend analysis (e.g., monthly shrinkage reports?)

---

## 🔗 Connected Notes

- [[planning|07-Planning Index]]
- [[02-Features/04-physical-stocktake|04-Physical Stocktake Specification]]
- [[02-Features/10-stock-movement-timeline|10-Stock Movement Timeline]]
- [[02-Features/08-supplier-delivery-receiving|08-Supplier Delivery Receiving]]
- [[07-Planning/notification-contents|Future Push Notification Contents]]
