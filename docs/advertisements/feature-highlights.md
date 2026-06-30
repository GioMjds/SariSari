# Core Feature Highlights & Value Propositions

This document defines the key features of the **SariSari** app and translates their technical capabilities into clear business values for sari-sari store owners.

---

## 1. Offline-First Architecture (Lokal at Ligtas)

- **Technical Definition:** SQLite database running entirely on-device via `expo-sqlite`, requiring zero network connections for core flows.
- **Value Proposition:** 100% data privacy and zero data cost. The app never stops working, regardless of power outages, storm seasons, or lack of cellular reception in remote barangays.
- **Key Marketing Copy:**
  - _"Zero Data, Zero Load, Hero Efficiency."_
  - _"Hindi kailangan ng signal para alamin ang iyong kita o ilista ang utang ng suki."_

---

## 2. Fast Point of Sale (POS)

- **Technical Definition:** React Native / NativeWind interface designed for low-tap, fast item selection, instant total calculation, and direct input of payment with automatic change calculation.
- **Value Proposition:** Reduces customer queue times, eliminates manual calculation errors, and automatically deducts stock levels upon sales completion.
- **Key Marketing Copy:**
  - _"POS na kasing-bilis ng abot-kamay."_
  - _"Benta at Sukli in 3 seconds. Tapos ang pila sa counter!"_

---

## 3. Automated Suki Utang Ledger

- **Technical Definition:** Local ledger database implementing strict First-In-First-Out (FIFO) payment allocation. Outstanding balances are dynamically calculated as `SUM(amount) - SUM(amount_paid)` within SQLite transactions (`db.withTransactionAsync`) to ensure integrity.
- **Value Proposition:** Prevents financial leakages due to forgotten credit, ensures mutual trust through transparent records, and guarantees that payments are applied correctly to the oldest debt.
- **Key Marketing Copy:**
  - _"Utang Ledger na may Respeto at Tiwala."_
  - _"Kusa at saktong kompyutasyon ng utang ng suki nang walang manual calculator math."_

---

## 4. Real-Time Inventory & Stock Alerts

- **Technical Definition:** Product catalog database mapped to categories with minimum stock thresholds. Automatically flags low items in the UI.
- **Value Proposition:** Prevents inventory tie-up (overstocking) and sales losses due to out-of-stock items. Allows store owners to generate exact shopping lists before going to suppliers.
- **Key Marketing Copy:**
  - _"Laging Ready ang Bestsellers Mo!"_
  - _"May Low Stock alert para alam mo kung ano ang kulang bago pa magtanong ang iyong suki."_

---

## 5. Daily Sales & Profit Reports

- **Technical Definition:** Local analytical queries aggregating daily/weekly sales transactions and calculating net margins (Sales - Cost of Goods Sold) displayed in simple visual charts.
- **Value Proposition:** Gives the owner an exact understanding of their daily _Kita_ (net profit), enabling better financial planning, household budget separation, and store growth.
- **Key Marketing Copy:**
  - _"Kuwentang Malinaw, Kitang Sigurado."_
  - _"Makita ang araw-araw na tubo nang hindi napupuyat sa pagkuwenta sa gabi."_
