# Statement of Intent: Barcode Scanning

- **Outcome:** A camera-based barcode scanning feature. When adding products to inventory, it looks up the barcode in a built-in offline list of popular Filipino products to pre-fill the **Product Name**. When selling, scanning a barcode instantly adds the matching product to the checkout cart.
- **User:** Sari-sari store owners who want to set up their inventory and check out customers quickly without manual typing or searching.
- **Why now:** Manual typing during inventory setup is slow, and manual search at the counter slows down sales when customers are waiting.
- **Success:** A store owner can scan a standard Filipino retail item (e.g., Lucky Me Noodles, Coke can), see the product name auto-populate instantly offline, and later scan that same item at the counter to sell it.
- **Constraint:** Must work 100% offline (local barcode lookup database) and run on Expo SDK 54 using the device camera.
- **Out of scope:** Online API barcode lookups (like Open Food Facts), receipt scanning, and automatic price/stock population.
