# Changelog

All notable changes to the **SariSari** project will be documented in this file.

---

## [1.2.0-alpha.1] - 2026-07-18

### Added

- **Instant Barcode Lookup**: Scanning a product barcode now resolves product name,
  brand, and category instantly (<10ms) without internet connection using local SQLite
  catalog.
  - **Pre-loaded Filipino Catalog**: Seeded common Philippine sari-sari store products
    (Lucky Me, Milo, Coca-Cola, Century Tuna) directly into the app for instant scanning on
    first install.
  - **Multi-Source Resolution**: Added fallback pipeline (Memory Cache → SQLite Catalog
    → Cloud Catalog → Manual Entry) ensuring store-specific selling prices and inventory
    counts are never overwritten.
