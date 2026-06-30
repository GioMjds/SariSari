# SariSari AI Brand & Advertising Generation System

This document serves as the single source of truth for generating marketing assets, onboarding illustrations, and social media graphics for the offline-first **SariSari** app. By combining a unified visual DNA with reusable asset libraries, it enables consistent generation of visual materials via AI image models (such as Bloom).

---

## Table of Contents

1. [Bloom Master Style (Visual DNA)](#1-bloom-master-style-visual-dna)
2. [Component Libraries (The Building Blocks)](#2-component-libraries-the-building-blocks)
   - [Scene Library (SCN)](#scene-library-scn)
   - [Pose Library (POS)](#pose-library-pos)
   - [Expression Library (EXP)](#expression-library-exp)
   - [Prop Library (PRP)](#prop-library-prp)
   - [Camera Library (CAM)](#camera-library-cam)
3. [Ad Specifications Matrix](#3-ad-specifications-matrix)
4. [Master Bloom Prompt Template](#4-master-bloom-prompt-template)
5. [Refactored 50-Ad Prompt Library](#5-refactored-50-ad-prompt-library)
   - [Category A: Utang & Credit Ledger (Ads 1–10)](#category-a-utang--credit-ledger-ads-110)
   - [Category B: Hard Offline-First (Ads 11–20)](#category-b-hard-offline-first-ads-1120)
   - [Category C: Fast Point of Sale (Ads 21–30)](#category-c-fast-point-of-sale-ads-2130)
   - [Category D: Inventory & Stock Alerts (Ads 31–40)](#category-d-inventory--stock-alerts-ads-3140)
   - [Category E: Seasonal, Educational & Community Success (Ads 41–50)](#category-e-seasonal-educational--community-success-ads-4150)
6. [Core Marketing Copy & Campaigns Cheatsheet](#6-core-marketing-copy--campaigns-cheatsheet)

---

## 1. Bloom Master Style (Visual DNA)

To ensure stylistic consistency across all generated assets, append this visual DNA section to all image generation briefs.

- **Illustration Style:** Clean, modern flat vector illustration with soft gradients, rounded shapes, and friendly, expressive characters. Clean lines, no complex sketch lines.
- **Color Palette (SariSari Brand Colors):**
  - **Primary:** Terracotta Orange (hex/approx: warm, friendly, traditional clay pot tone)
  - **Secondary:** Warm Cream (hex/approx: clean, soft contrast background)
  - **Accent:** Charcoal (hex/approx: high legibility outlines and dark-gray UI components)
  - **Growth/Success Accent:** Emerald Green (used strictly for transaction completions, profits, and active credits)
- **Mascot (Sari):**
  - **Profile:** 34-year-old Filipina shop owner (_tindera_). Energetic, friendly, smiling, practical, tech-savvy.
  - **Attire:** Hair tied back neatly in a low bun, wearing a simple t-shirt and a terracotta-colored apron with front pockets.
- **Lighting:** Bright, natural morning daylight. Warm, optimistic highlights.
- **Shadows:** Soft flat vector shadows with low opacity.
- **Negative Space:** Maintain a strict **30% negative space** at the top or side for overlays, headers, and headline text.
- **Typography Constraint:** **No readable text** in the generated image. Use symbols, abstract UI line representations, and mockups. No words, no fake lettering.

---

## 2. Component Libraries (The Building Blocks)

### Scene Library (SCN)

- **SCN01 (Store Exterior):** Front facade of a local Filipino sari-sari store. Wood panels, counter window, hanging snack packets on metal bars, metal mesh gate open, cozy neighborhood street background.
- **SCN02 (Store Interior):** View from inside the store looking out, showing rows of neatly stacked canned food, shelves of detergent boxes, clear jars of candies, and natural light coming through the counter window.
- **SCN03 (Checkout Counter):** Close-up of the smooth wood counter surface. A coin box, a small receipt pad, and popular impulse-buy snacks on display.
- **SCN04 (Product Shelves):** Organized vertical wood or metal shelving units packed with colorful, simplified packages of noodles, vinegar bottles, and soy sauce bottles.
- **SCN05 (Inventory Storage):** Back of the store with stacked wooden boxes, egg trays, and sacks of rice, showing organization.
- **SCN06 (Back Room / Office):** A minimalist desk area with a ledger book, a stool, and soft warm lighting.
- **SCN07 (Morning Opening):** The shop front at dawn. Soft morning mist, golden sun rays hitting the wooden panels, shutter rolled up halfway, quiet neighborhood street.
- **SCN08 (Evening Closing):** The shop front at twilight. Cozy yellow lantern light glowing from inside the store, quiet street, stars emerging in the soft gradient sky.
- **SCN09 (Neighborhood Street):** A clean barangay road. Neighbors walking by, colorful houses, tricycle parked in the distance, sunny skies.
- **SCN10 (Customer Interaction Space):** View centering the counter space, with the owner inside the store and the customer standing outside looking in.

### Pose Library (POS)

- **POS01 (Warm Wave):** Sari standing, smiling, waving one hand welcomingly toward the camera.
- **POS02 (Point Left):** Sari pointing both hands or one hand to the left side of the frame with an enthusiastic expression.
- **POS03 (Point Right):** Sari pointing both hands or one hand to the right side of the frame.
- **POS04 (Thinking/Puzzled):** Sari with one hand on her chin, looking slightly upwards with a curious or thoughtful expression.
- **POS05 (Holding Phone):** Sari presenting a smartphone in one hand, holding it towards the camera, while her other hand gestures towards it.
- **POS06 (Holding Grocery):** Sari holding a bag of grocery items or a box of goods with both hands.
- **POS07 (Scanning / Tapping Phone):** Sari actively tapping or interacting with her smartphone screen.
- **POS08 (Celebrating / Thumbs Up):** Sari smiling broadly, giving a double thumbs-up or raising hands in success.
- **POS09 (Walking / Stocking):** Sari carrying a small box, walking next to the product shelves.
- **POS10 (Explaining / Conversing):** Sari resting one hand on the counter, gesturing with the other hand as if explaining something friendly.

### Expression Library (EXP)

- **EXP01 (Happy / Welcoming):** Warm, authentic smile, open eyes, radiating friendliness and neighborhood warmth.
- **EXP02 (Proud / Confident):** Confident smile, relaxed eyebrows, posture showing business mastery.
- **EXP03 (Curious / Inquiring):** Slightly tilted head, raised eyebrow, friendly interest.
- **EXP04 (Thinking / Analytical):** Pensive look, eyes looking up-left, calm smile, showing calculation.
- **EXP05 (Excited / Energized):** Wide smile, bright eyes, showing high energy and discovery.
- **EXP06 (Concerned / Confused):** Furrowed brow, worried eyes, looking at a messy ledger or empty drawer, showing the "before" state.
- **EXP07 (Determined / Resilient):** Focused gaze, firm smile, showing readiness to solve business problems.
- **EXP08 (Celebrating / Victorious):** Big open-mouth smile, shut eyes or happy eyes, expressing joy.

### Prop Library (PRP)

- **PRP01 (Grocery Basket):** Clean woven basket containing instant noodles, milk cartons, and canned sardines.
- **PRP02 (Canned Goods):** Flat vector representations of local canned products (sardines, corned beef, tuna) with clean, minimal labels.
- **PRP03 (Rice Sack):** Large burlap or canvas sack overflowing with clean white grains of rice.
- **PRP04 (Instant Noodles):** Colorful pillow packages representing local noodle brands.
- **PRP05 (Soda Bottle):** Clear glass or plastic bottles showing carbonated drinks, stacked in cases.
- **PRP06 (Barcode Scanner):** Minimalist handheld reader, though primarily phone camera scanning is used.
- **PRP07 (Smartphone):** Modern bezel-less smartphone displaying simplified green and cream SariSari app UI components.
- **PRP08 (Paper Receipt / Ledger):** A vintage paper ledger book with crossed-out lines and ink marks (used as a contrast prop).
- **PRP09 (Notebook):** Traditional spiral-bound notebook with torn pages and handwritten scribble representations.
- **PRP10 (Peso Coins / Bills):** Coins showing stylized peso symbols and green/blue bill representations.
- **PRP11 (Cash Drawer):** Wooden drawer containing divided sections for coins and bills.
- **PRP12 (Low Stock Warning Icon):** A stylized orange glowing bell or exclamation mark icon floating next to empty shelves.

### Camera Library (CAM)

- **CAM01 (Eye Level):** Straight-on portrait or landscape shot at eye level, flat perspective.
- **CAM02 (Top-Down / Flat Lay):** High-angle overhead view looking straight down at the counter or floor layout.
- **CAM03 (Isometric):** Angled 3D orthographic view showing layout and depth.
- **CAM04 (Three-Quarter):** Angled shot showing front and side of the characters or store.
- **CAM05 (Close-Up):** Tight framing focusing on hands, phone screen, or specific props.
- **CAM06 (Wide Shot):** Group or environment-focused shot capturing the entire store and neighborhood setting.
- **CAM07 (Hero Shot):** Dramatic low-angle looking slightly up at Sari, conveying confidence and empowerment.
- **CAM08 (Portrait):** Clean head-and-shoulders frame focusing on character expression.

---

## 3. Ad Specifications Matrix

| Platform                        | Recommended Aspect Ratio      | Recommended Resolution | Primary Marketing Purpose                            |
| :------------------------------ | :---------------------------- | :--------------------- | :--------------------------------------------------- |
| **Facebook Feed**               | 1:1 (Square)                  | 1200 × 1200 px         | Direct response ads, testimonial quotes              |
| **Instagram Feed**              | 4:5 (Vertical)                | 1080 × 1350 px         | Carousel slides, product feature highlights          |
| **Instagram / FB Stories**      | 9:16 (Tall)                   | 1080 × 1920 px         | Temporary promotions, flash highlights, Reels covers |
| **Google Play Feature Graphic** | 1024:500 (Landscape)          | 1024 × 500 px          | Play Store branding banner                           |
| **App Store Screenshots**       | Device-specific (9:16/19.5:9) | 1284 × 2778 px         | Core app feature demonstration mockups               |
| **X/Twitter Feed**              | 16:9 (Landscape)              | 1200 × 675 px          | Quick updates, tech/startup news features            |
| **LinkedIn Posts**              | 1.91:1 (Landscape)            | 1200 × 628 px          | Corporate updates, partnership announcements         |

---

## 4. Master Bloom Prompt Template

When writing a prompt, combine the style guide variables, selected libraries, and negative space declarations. Follow this structured blueprint:

```
[System style call: Flat vector illustration style, Bloom Master Style guidelines apply.]
Platform/Aspect Ratio: [From Spec Matrix]
Camera Angle: [From Camera Library]
Scene/Environment: [From Scene Library]
Character Actions: [From Pose Library & Mascot description]
Facial Expression: [From Expression Library]
Core Props: [From Prop Library]
Color Scheme: [Primary colors, specific accents]
Composition & Layout Constraints: [Negative space instructions, no readable text constraint]
```

---

## 5. Refactored 50-Ad Prompt Library

Below is the complete 50-ad library. Each entry has been refactored to use the standardized component IDs to guarantee visual consistency.

### Category A: Utang & Credit Ledger (Ads 1–10)

#### Ad 1: "The Damp Notebook vs. Sleek Phone"

- **Platform:** Facebook Feed | **Aspect Ratio:** 1:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN03 (Checkout Counter).
  Character: Sari in POS05 (Holding Phone) showing EXP01 (Happy / Welcoming).
  Props: PRP07 (Smartphone showing green ledger UI) held in foreground, PRP09 (Notebook with torn edges and water spots) lying closed to the left.
  Composition: 30% empty negative space at the top. Left-to-right contrast.
  Style Constraints: Modern flat vector illustration, no readable text, no letters.
  ```

#### Ad 2: "FIFO Credit Allocation Explained"

- **Platform:** Instagram Feed | **Aspect Ratio:** 4:5
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM05 (Close-Up), SCN03 (Checkout Counter).
  Character: A customer hand handing PRP10 (Peso Coins / Bills) to Sari's hand.
  Visual Details: Sari's hand points to PRP07 (Smartphone). The screen displays three stacked horizontal list cards; the oldest card is illuminated in emerald green with a checkmark.
  Composition: Left-aligned negative space (30%) for carousel typography overlays.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 3: "Suki Transparency Check"

- **Platform:** Facebook Stories | **Aspect Ratio:** 9:16
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM04 (Three-Quarter), SCN10 (Customer Interaction Space).
  Characters: Sari in POS10 (Explaining / Conversing) with EXP01 (Happy / Welcoming), and Aling Nena with EXP01 (Happy / Welcoming).
  Props: PRP07 (Smartphone showing transaction rows) held between them.
  Composition: Top 35% empty space for vertical text.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 4: "No More Lost Pages"

- **Platform:** Instagram Stories | **Aspect Ratio:** 9:16
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN06 (Back Room / Office).
  Character: None (Prop focus).
  Props: PRP09 (Notebook with pages floating in mid-air away from viewer), contrasting with a firm hand catching PRP07 (Smartphone displaying a green padlock and shield).
  Composition: Bottom 30% empty space for a CTA button.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 5: "The Accurate Sum Ledger"

- **Platform:** X/Twitter Feed | **Aspect Ratio:** 16:9
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN03 (Checkout Counter).
  Character: Sari in POS08 (Celebrating / Thumbs Up) with EXP02 (Proud / Confident).
  Props: PRP07 (Smartphone displaying clean list items) resting next to a giant green checkmark symbol.
  Composition: Right 45% empty negative space for ad copy.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 6: "The Awkward Calculator Argument"

- **Platform:** Facebook Feed | **Aspect Ratio:** 1:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM04 (Three-Quarter), SCN10 (Customer Interaction Space).
  Characters: Split composition. Left: Customer looking at a complex calculator with EXP06 (Concerned / Confused). Right: Sari standing at SCN03 counter with EXP01 (Happy / Welcoming), holding PRP07 (Smartphone).
  Composition: Top 30% empty space for headline.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 7: "The Running Balance Audit"

- **Platform:** LinkedIn Post | **Aspect Ratio:** 1.91:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM03 (Isometric), SCN06 (Back Room / Office).
  Character: None (Data dashboard focus).
  Props: PRP07 (Smartphone) surrounded by clean floating green transaction ledger sheets.
  Composition: Center-focused, left side empty for business text.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 8: "Suki Trust Builder"

- **Platform:** Instagram Feed | **Aspect Ratio:** 4:5
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN10 (Customer Interaction Space).
  Characters: Sari and Aling Nena shaking hands over SCN03 (Checkout Counter).
  Props: PRP07 (Smartphone) showing a friendly receipt summary on SCN03 counter.
  Composition: Top 25% negative space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 9: "The Digital Ledger Swap"

- **Platform:** Google Play Feature Graphic | **Aspect Ratio:** 1024:500
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN02 (Store Interior).
  Character: Sari in POS05 (Holding Phone) with EXP02 (Proud / Confident).
  Props: PRP08 (Paper Receipt / Ledger) dissolving in background, replaced by glowing geometric clean blocks showing green checkmarks.
  Composition: Center-split composition, clean branding space on the left.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 10: "Receipt Sharing via Messenger"

- **Platform:** Facebook Feed | **Aspect Ratio:** 1:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM05 (Close-Up), SCN09 (Neighborhood Street).
  Character: Hand holding PRP07 (Smartphone). A clean screenshot of an itemized statement is sent, visualized by a paper airplane icon flying out of the phone.
  Composition: Top 30% negative space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

---

### Category B: Hard Offline-First (Ads 11–20)

#### Ad 11: "The Typhoon Brownout"

- **Platform:** Facebook Feed | **Aspect Ratio:** 1:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN02 (Store Interior).
  Character: Sari in POS07 (Scanning / Tapping Phone) with EXP01 (Happy / Welcoming).
  Props: PRP07 (Smartphone showing green active ledger screen), candle burning next to phone on SCN03 (Checkout Counter). Rain and cloud silhouettes visible outside counter window.
  Lighting: Warm candlelight glow on Sari's face.
  Composition: Top 30% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 12: "Airplane Mode POS"

- **Platform:** Instagram Feed | **Aspect Ratio:** 4:5
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM05 (Close-Up), SCN03 (Checkout Counter).
  Props: PRP07 (Smartphone) showing an active POS checkout screen. Next to it floats an orange airplane symbol inside an orange circle.
  Composition: Top 25% negative space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 13: "Zero Signal, Zero Stress"

- **Platform:** Facebook Stories | **Aspect Ratio:** 9:16
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM06 (Wide Shot), SCN09 (Neighborhood Street).
  Character: Sari in POS05 (Holding Phone) with EXP01 (Happy / Welcoming).
  Props: A large crossed-out cellular signal bar icon floats above PRP07 (Smartphone).
  Composition: Top 35% empty space for vertical text overlay.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 14: "The Mountain Shop"

- **Platform:** Instagram Stories | **Aspect Ratio:** 9:16
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM06 (Wide Shot), SCN01 (Store Exterior).
  Character: Sari in POS07 (Scanning / Tapping Phone) standing outside the store facade.
  Visual Details: Background features clean green vector mountains. A cellular tower icon with a red slash floats in the sky.
  Composition: Top 30% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 15: "Hard Offline Invariant"

- **Platform:** X/Twitter Feed | **Aspect Ratio:** 16:9
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM03 (Isometric), SCN06 (Back Room / Office).
  Props: A smartphone split visual: Left shows internet router with a red X; right shows a local safe vault filled with credit records.
  Composition: Left 35% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 16: "No Data Bills"

- **Platform:** Facebook Feed | **Aspect Ratio:** 1:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN03 (Checkout Counter).
  Character: Sari in POS05 (Holding Phone) with EXP01 (Happy / Welcoming).
  Props: Stylized scissors cutting a paper bill with cellular data symbols on it in half.
  Composition: Top 30% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 17: "The Secure Local Database"

- **Platform:** LinkedIn Post | **Aspect Ratio:** 1.91:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM03 (Isometric), SCN06 (Back Room / Office).
  Props: PRP07 (Smartphone) surrounded by an emerald green padlock and shield icon.
  Composition: Center-focused, left and right negative space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 18: "Island Store Transactions"

- **Platform:** Instagram Feed | **Aspect Ratio:** 4:5
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM06 (Wide Shot), SCN01 (Store Exterior).
  Characters: Sari inside the storefront, customer outside at counter window.
  Visual Details: Clean tropical beach, palm trees, ocean in background. Router icon with a red slash floats.
  Composition: Top 25% empty.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 19: "The Stormproof Business"

- **Platform:** Google Play Feature Graphic | **Aspect Ratio:** 1024:500
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN10 (Customer Interaction Space).
  Characters: Sari in SCN02 with EXP02 (Proud / Confident).
  Visual Details: Contrast composition. Left side is stormy dark weather; right side is cozy, illuminated counter interior.
  Composition: Center split, clear branding space on the left.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 20: "No Loading Spinners"

- **Platform:** Facebook Feed | **Aspect Ratio:** 1:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN03 (Checkout Counter).
  Props: A hand throwing away a cellular loading spinner icon into a trash bin. The other hand holds PRP07 (Smartphone) showing instantaneous green checkmarks.
  Composition: Top 30% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

---

### Category C: Fast Point of Sale (POS) & Queue Buster

#### Ad 21: "The 3-Second Counter Transaction"

- **Platform:** Facebook Feed | **Aspect Ratio:** 1:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN03 (Checkout Counter).
  Character: Sari in POS07 (Scanning / Tapping Phone) with EXP01 (Happy / Welcoming).
  Props: PRP07 (Smartphone displaying product grid), green checkmark and stopwatch icon floating above.
  Composition: Top 30% negative space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 22: "Automatic Change Calculator"

- **Platform:** Instagram Feed | **Aspect Ratio:** 4:5
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM05 (Close-Up), SCN03 (Checkout Counter).
  Props: PRP07 (Smartphone showing check/change details) and a hand passing PRP10 (Peso Coins / Bills).
  Composition: Top 25% negative space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 23: "Queue-Buster"

- **Platform:** Facebook Stories | **Aspect Ratio:** 9:16
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM04 (Three-Quarter), SCN10 (Customer Interaction Space).
  Character: Sari in SCN02 store counter looking out with EXP01 (Happy / Welcoming).
  Visual Details: Queue of three friendly customers waiting at the counter. Sari is using PRP07 (Smartphone) quickly.
  Composition: Top 35% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 24: "No More Manual Math"

- **Platform:** Instagram Stories | **Aspect Ratio:** 9:16
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN03 (Checkout Counter).
  Props: PRP09 (Notebook) and an old paper calculator split by a lightning bolt, dissolving. PRP07 (Smartphone) stands intact.
  Composition: Top 30% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 25: "Fast Add to Cart"

- **Platform:** X/Twitter Feed | **Aspect Ratio:** 16:9
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM03 (Isometric), SCN03 (Checkout Counter).
  Props: PRP07 (Smartphone showing POS interface) with product blocks flying into a shopping cart graphic.
  Composition: Left 40% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 26: "The Busy Counter"

- **Platform:** Facebook Feed | **Aspect Ratio:** 1:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN10 (Customer Interaction Space).
  Character: Sari in POS10 (Explaining / Conversing) with EXP01 (Happy / Welcoming).
  Props: Sari hands over PRP01 (Grocery Basket) with one hand, while logging the sale on PRP07 (Smartphone) with the other.
  Composition: Top 30% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 27: "Instant Transaction Logs"

- **Platform:** LinkedIn Post | **Aspect Ratio:** 1.91:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM03 (Isometric), SCN06 (Back Room / Office).
  Props: PRP07 (Smartphone displaying transaction history list rows).
  Composition: Centered phone, balanced left/right space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 28: "The Counter Hand-Off"

- **Platform:** Instagram Feed | **Aspect Ratio:** 4:5
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM05 (Close-Up), SCN03 (Checkout Counter).
  Props: Close-up of a hand passing PRP05 (Soda Bottle) over counter wood surface. PRP07 (Smartphone) rests nearby.
  Composition: Top 25% negative space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 29: "The Zero-Error Register"

- **Platform:** Google Play Feature Graphic | **Aspect Ratio:** 1024:500
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN02 (Store Interior).
  Character: Sari in POS08 (Celebrating / Thumbs Up) with EXP02 (Proud / Confident).
  Props: PRP07 (Smartphone displaying POS details).
  Composition: Center split, clear branding space on the left.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 30: "The Math Solution"

- **Platform:** Facebook Feed | **Aspect Ratio:** 1:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN06 (Back Room / Office).
  Props: A blackboard with complex math formulas being wiped away by a giant green eraser. PRP07 (Smartphone) stands in front.
  Composition: Top 30% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

---

### Category D: Inventory & Stock Alerts (Ads 31–40)

#### Ad 31: "The Low Stock Warning Alert"

- **Platform:** Facebook Feed | **Aspect Ratio:** 1:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN04 (Product Shelves).
  Character: None (Shelf focus).
  Props: PRP12 (Low Stock Warning Icon) glowing next to empty shelf spaces, alongside PRP07 (Smartphone showing warning product list).
  Composition: Top 30% negative space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 32: "Smart Categories Sorting"

- **Platform:** Instagram Feed | **Aspect Ratio:** 4:5
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM03 (Isometric), SCN02 (Store Interior).
  Props: PRP07 (Smartphone) acting as a base for floating, organized category folder blocks.
  Composition: Top 25% empty.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 33: "Never Run Out of Bestsellers"

- **Platform:** Facebook Stories | **Aspect Ratio:** 9:16
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN04 (Product Shelves).
  Character: Sari in POS09 (Walking / Stocking) with EXP01 (Happy / Welcoming).
  Props: PRP07 (Smartphone) displaying green checks next to product category icons.
  Composition: Top 35% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 34: "Low Stock Alert Onboarding"

- **Platform:** Instagram Stories | **Aspect Ratio:** 9:16
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM05 (Close-Up), SCN04 (Product Shelves).
  Props: PRP07 (Smartphone showing a warning bell icon ringing next to product list items).
  Composition: Top 30% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 35: "The Supplier Shopping List"

- **Platform:** X/Twitter Feed | **Aspect Ratio:** 16:9
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM04 (Three-Quarter), SCN09 (Neighborhood Street).
  Characters: Sari in POS10 (Explaining / Conversing) and Kuya Jun (Supplier) holding SCN05 crates.
  Props: PRP07 (Smartphone showing shopping checklist).
  Composition: Left 35% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 36: "Organized Shelves, Organized Mind"

- **Platform:** Facebook Feed | **Aspect Ratio:** 1:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN04 (Product Shelves).
  Props: Split composition. Left: messy product shelf with products falling over. Right: tidy categorized display with PRP07 (Smartphone).
  Composition: Top 30% empty.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 37: "Bulk Order Tracking"

- **Platform:** LinkedIn Post | **Aspect Ratio:** 1.91:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM03 (Isometric), SCN05 (Inventory Storage).
  Props: Standard supply crates transforming into neat digital tiles on PRP07 (Smartphone).
  Composition: Right-aligned key elements.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 38: "The Bestseller Spotlight"

- **Platform:** Instagram Feed | **Aspect Ratio:** 4:5
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN04 (Product Shelves).
  Props: PRP02 (Canned Goods) and PRP04 (Instant Noodles) under a soft vector spotlight, next to PRP07 (Smartphone showing sales graph).
  Composition: Top 20% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 39: "Play Store Category Banner"

- **Platform:** Google Play Feature Graphic | **Aspect Ratio:** 1024:500
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN02 (Store Interior).
  Character: Sari in POS05 (Holding Phone) with EXP01 (Happy / Welcoming).
  Props: PRP07 (Smartphone showing organized category icons).
  Composition: Center split, clear branding space on the left.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 40: "The Stock Replenisher"

- **Platform:** Facebook Feed | **Aspect Ratio:** 1:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN04 (Product Shelves).
  Props: Hand moving a digital product box icon into SCN04 shelf layout on PRP07 (Smartphone).
  Composition: Top 30% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

---

### Category E: Seasonal, Educational & Community Success (Ads 41–50)

#### Ad 41: "Paskong Masagana (Christmas Rush)"

- **Platform:** Facebook Feed | **Aspect Ratio:** 1:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN10 (Customer Interaction Space).
  Character: Sari in POS07 (Scanning / Tapping Phone) with EXP08 (Celebrating / Victorious).
  Props: PRP07 (Smartphone), SCN03 counter decorated with a paper Christmas star (parol). Customers holding holiday groceries.
  Color Palette: Brand colors with festive red and green highlights.
  Composition: Top 30% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 42: "Balik-Eskwela Prep (Back-to-School)"

- **Platform:** Instagram Feed | **Aspect Ratio:** 4:5
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM03 (Isometric), SCN04 (Product Shelves).
  Props: Pencils, intermediate paper pads, and juice boxes neatly organized as categories on PRP07 (Smartphone).
  Composition: Top 25% negative space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 43: "Summer Fiesta Rush"

- **Platform:** Facebook Stories | **Aspect Ratio:** 9:16
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM04 (Three-Quarter), SCN10 (Customer Interaction Space).
  Characters: Sari in SCN02 and customer at window counter buying ice candy.
  Props: PRP07 (Smartphone showing POS sale). Banderitas (fiesta flags) hanging outside.
  Composition: Top 35% empty for text overlays.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 44: "How to Spot Lost Profits (Educational)"

- **Platform:** Instagram Feed | **Aspect Ratio:** 4:5
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN06 (Back Room / Office).
  Props: A coin jar with a crack where abstract coins leak out. Next to it, a phone with a green shield represents saving those profits.
  Composition: Left-aligned negative space for educational carousel slides.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 45: "SariSari Star Store Success"

- **Platform:** LinkedIn Post | **Aspect Ratio:** 1.91:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM07 (Hero Shot), SCN01 (Store Exterior).
  Character: Sari in POS08 (Celebrating / Thumbs Up) with EXP02 (Proud / Confident).
  Props: PRP07 (Smartphone showing upward-trending profit graphs).
  Composition: Right-sided composition, left side negative space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 46: "The Self-Use Inventory Tracker"

- **Platform:** Facebook Feed | **Aspect Ratio:** 1:1
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM05 (Close-Up), SCN04 (Product Shelves).
  Props: A hand taking soap from a shelf, while another hand registers it on PRP07 (Smartphone) under a personal category.
  Composition: Top 30% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 47: "Daily Profit Summary Screen"

- **Platform:** Instagram Feed | **Aspect Ratio:** 4:5
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM05 (Close-Up), SCN06 (Back Room / Office).
  Props: PRP07 (Smartphone showing daily dashboard summaries with upward trending green arrows).
  Composition: Top 25% negative space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 48: "The Barangay Network"

- **Platform:** Facebook Stories | **Aspect Ratio:** 9:16
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM06 (Wide Shot), SCN09 (Neighborhood Street).
  Characters: Three store owners smiling together, each holding PRP07 (Smartphone displaying SariSari logo).
  Composition: Top 35% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 49: "The Empty Drawer Mystery"

- **Platform:** Instagram Feed | **Aspect Ratio:** 4:5
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN02 (Store Interior).
  Character: Sari in SCN02 with EXP06 (Concerned / Confused), looking into PRP11 (Cash Drawer) which is empty.
  Composition: Top 30% empty space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

#### Ad 50: "The App Store Feature Graphic"

- **Platform:** Google Play Feature Graphic | **Aspect Ratio:** 1024:500
- **Bloom Visual Prompt:**
  ```
  Bloom Master Style, CAM01 (Eye Level), SCN01 (Store Exterior).
  Character: Sari in POS01 (Warm Wave) with EXP01 (Happy / Welcoming).
  Props: A large PRP07 (Smartphone displaying app dashboard) sits next to her.
  Composition: Right-sided character focus, left-sided negative branding space.
  Style Constraints: Modern flat vector illustration, no readable text.
  ```

---

## 6. Core Marketing Copy & Campaigns Cheatsheet

Use these ready-to-use copy blocks when designing final ad assets that overlay the generated visuals.

### Campaign: "Goodbye, Notebook!" (Utang Ledger)

- **Tagline (Taglish):** _"Paalam Notebook, Hello Digital Ledger!"_
- **Primary Text:**
  📓 Nakakapagod ba magkuwenta ng utang? Ang lumang notebook, madaling mawala, mapunit, o mabasa. I-upgrade ang tindahan gamit ang **SariSari app**!
  - 100% Offline (Zero Load)
  - Automatic balance calculations (FIFO style)
  - Madaling i-screenshot at i-share sa suki via Messenger!

### Campaign: "Brownout-Proof POS" (Offline Architecture)

- **Tagline (Taglish):** _"Kahit Walang Internet, Tuloy ang Benta!"_
- **Primary Text:**
  🌧️ Brownout o mahina ang signal sa inyong barangay? Walang problema sa **SariSari app**!
  - Lahat ng listahan, ligtas sa iyong mobile phone database.
  - Zero data, zero internet signal required para magbenta, mag-imbentaryo, at maningil.

### Campaign: "Tindahan Upgrade" (Fast POS & Stock Alerts)

- **Tagline (Taglish):** _"Mabilis na Benta, Malinaw na Tubo!"_
- **Primary Text:**
  🚀 I-upgrade ang counter ngayong taon!
  - POS with automatic change calculator in 3 seconds.
  - Low stock warning alerts para laging kompleto ang bestsellers mo.
  - Daily profit dashboard reports to track your actual earnings easily.
