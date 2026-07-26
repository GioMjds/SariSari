# More Tab UI Revamp Design Specification

- **Date:** 2026-07-26
- **Target Path:** `app/(tabs)/more`
- **Status:** Approved Spec

---

## 1. Executive Summary

The More Tab (`app/(tabs)/more`) serves as the administrative, reporting, and operational command center for the SariSari mobile POS application. This specification details the complete UI/UX revamp of the More Tab to establish visual and architectural parity with the revamped Home, Sales, Inventory, and Customer tabs defined in `FUTURE_REVAMP.md`.

The layout adopts a **hybrid navigation model**:

- A **top horizontal swipe container** switching between 4 sub-tabs: **Reports**, **Insights**, **Sync**, and **Settings**.
- **Stack drill-down routes** (`[detail].tsx`) for secondary pages like PDF/CSV report exports, backup manager details, and system audit logs.

---

## 2. Navigation & File Hierarchy

```txt
app/(tabs)/more/
├── _layout.tsx         # Swipe container, sub-tab header bar (Reports | Insights | Sync | Settings)
├── reports.tsx         # P&L financial metrics, date filtering, sales charts, payment splits
├── insights.tsx        # Automated business intelligence, stock movers, margin leak alerts
├── sync.tsx            # Cloud sync queue status, manual sync, local backup & restore
├── settings.tsx        # Store profile, POS preferences, theme, scanner/printer hardware
└── [detail].tsx        # Stack route for drill-downs (Export Report, Backup Detail, Audit Logs)
```

---

## 3. Sub-Tab Detailed Specifications

### A. Reports Sub-Tab (`reports.tsx`)

Primary financial P&L and sales analytics dashboard.

- **Date Range Selector:** Header control supporting `Today`, `This Week`, `This Month`, and `Custom Range`.
- **Financial Bento Grid (KPI Cards):**
  - Total Revenue / Sales (with period-over-period percentage change)
  - Gross Profit & Profit Margin %
  - Operating Expenses & Drawings
  - Net Profit
- **Sales & Credit Breakdown:**
  - `PaymentSplitStrip` visual ratio showing Cash Sales vs Credit Sales.
  - Average Order Value and Total Transaction Count.
- **Product & Aging Insights:**
  - `TopProductsList`: Top 5 products by revenue and volume.
  - `CreditAgingChart`: Visual debt distribution (0-30 days, 31-60 days, >60 days overdue).
- **Export Trigger:** Action button launching `[detail].tsx?type=export`.

### B. Insights Sub-Tab (`insights.tsx`)

Automated store recommendations and alert diagnostics.

- **Store Operational Health Scorecard:** Summary card showing inventory efficiency and credit collection rate.
- **Actionable Intelligence Cards:**
  - **Fast Movers & High-Margin Highlights:** Inventory items generating maximum profit.
  - **Slow-Moving Capital Warning:** Items inactive for >30 days.
  - **Credit Risk Radar:** Flags overdue customer accounts threatening cash flow.
  - **Margin Leak Alerts:** Identifies items selling below target gross profit margin.

### C. Sync Sub-Tab (`sync.tsx`)

Offline-first synchronization and data safety center.

- **Connection & Status Hero Banner:**
  - Online / Offline badge indicator.
  - Timestamp of last successful sync.
- **Unsynced Queue Status Card:**
  - Counter of pending local transactions waiting to upload.
  - Primary **"Sync Now"** trigger with loading spinner and retry handling.
- **Database Backup & Restore Manager:**
  - **"Create Local Backup"** instant action button.
  - List of local SQLite database backups (Timestamp, file size, restore/export options).
- **System Audit Log Preview:**
  - Compact feed of recent system events.
  - "View Full Audit Log" link launching `[detail].tsx?type=audit`.

### D. Settings Sub-Tab (`settings.tsx`)

Store preferences and device configuration.

- **Store Profile:** Store name, owner name, contact number, permit details.
- **POS Hardware & Preferences:**
  - Thermal Bluetooth Receipt Printer setup & test print.
  - Barcode Scanner feedback toggles (audio & vibration).
  - Default receipt footer note.
- **Theme & Formatting:**
  - Theme mode selector (Dark / Light / System).
  - Currency display formatting (PHP ₱).
- **Data Maintenance & Safety:**
  - Compact local SQLite database / clear cached files.
  - Application version display (`v1.0.0`).

---

## 4. Stack Routes (`[detail].tsx`)

Detail pages slide in as standard stack routes:

1. **`type=export` (Report Export):**
   - Summary preview.
   - Generate PDF / Generate CSV triggers using native sharing (`expo-sharing`).
2. **`type=backup` (Backup Detail):**
   - Backup file metadata and table row counts.
   - "Restore Database" confirmation dialog.
3. **`type=audit` (System Audit Log):**
   - Searchable log viewer for sync batches, inventory updates, and credit changes.
   - Log level filter (`All`, `Info`, `Warning`, `Error`).

---

## 5. Non-Functional & Reliability Requirements

- **Offline Resilience:** All screens remain 100% functional offline; sync status updates gracefully when connection is lost/restored.
- **Performance:** Shared hooks (`useReports`, `useReportKPIs`, `useReportInsights`) utilize React Query caching to prevent redundant SQLite queries on tab switches.
- **Visual Design:** Strict adherence to design tokens, typography scales, and component layouts established in the Home, Sales, Inventory, and Customer tab revamps.
