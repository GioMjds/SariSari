# Permission Based Operation (Access System)

> **Parent Index**: [[planning|07-Planning Index]]  
> **Related Feature Specs**: [[02-Features/11-owner-pin-for-sensitive-actions|11-Owner PIN for Sensitive Actions]] | [[02-Features/16-shift-tracking-on-one-device|16-Shift Tracking on One Device]]

Many store owners leave their store with trusted family members or staff for periods of time. They require granular permission control or a simple PIN gatekeeper so staff can execute sales without modifying core pricing, deleting records, or exporting financial totals.

---

## Permissions Matrix

| Permission             | Owner |    Staff | Linked Feature / System                           |                             |
| ---------------------- | ----: | -------: | ------------------------------------------------- | --------------------------- |
| Make sales             |   Yes |      Yes | [[02-Features/01-pos-fast-lane                    | [[01-POS Fast Lane]]        |
| View inventory         |   Yes |      Yes | Catalog View                                      |                             |
| Add products           |   Yes | Optional | Catalog Management                                |                             |
| Adjust stock           |   Yes | Optional | [[02-Features/04-physical-stocktake               | [[04-Physical Stocktake]]   |
| View customer credits  |   Yes | Optional | [[02-Features/05-utang-guardrails-at-checkout     | [[05-Utang Guardrails]]     |
| Add credit             |   Yes | Optional | [[02-Features/05-utang-guardrails-at-checkout     | [[05-Utang Guardrails]]     |
| Edit credit            |   Yes |    Maybe | Credit Adjustments                                |                             |
| Delete transaction     |   Yes |       No | [[02-Features/07-safe-voids-refunds-corrections   | [[07-Safe Voids & Refunds]] |
| View financial reports |   Yes |       No | [[02-Features/14-transparent-local-store-insights | [[14-Store Insights]]       |
| Change store settings  |   Yes |       No | Application Settings                              |                             |
| Manage staff           |   Yes |       No | [[02-Features/16-shift-tracking-on-one-device     | [[16-Shift Tracking]]       |
| Export data            |   Yes |       No | Data Export                                       |                             |

---

## 🔗 Connected Notes

- [[planning|07-Planning Index]]
- [[02-Features/11-owner-pin-for-sensitive-actions|11-Owner PIN for Sensitive Actions]]
- [[02-Features/16-shift-tracking-on-one-device|16-Shift Tracking on One Device]]
- [[02-Features/07-safe-voids-refunds-corrections|07-Safe Voids, Refunds & Corrections]]
