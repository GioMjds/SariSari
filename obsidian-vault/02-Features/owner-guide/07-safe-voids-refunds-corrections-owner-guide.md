---
title: Safe Voids, Refunds & Corrections — Owner Testing Guide
description: A walkthrough for store owners testing the new void, refund, and price-correction features on SariSari.
created: 2026-08-13
type: owner-guide
audience: store-owner
feature: 07-safe-voids-refunds-corrections
status: draft
tags:
  [feature, corrections, void, refund, price-correction, audit, owner-facing]
---

> Companion guide to [[02-Features/07-safe-voids-refunds-corrections|07. Safe Voids, Refunds & Corrections]]. Where that note is the spec for engineers, this one is the test script for store owners.

A step-by-step tour for store owners trying the new "I made a mistake" tools in SariSari. Read this once, then keep the app open beside it.

## What this guide is for

You just installed a new set of tools that lets you fix mistakes at the register **without losing your records**. Before you trust them with real money, walk through the four test scenarios below. Each one takes about 3 minutes. If something looks wrong, stop and call your technician — the audit log is still safe; nothing gets erased by accident.

You will be testing four things:

1. **Void** — completely cancel a sale that just happened.
2. **Refund** — record that a customer brought something back.
3. **Price correction** — fix a single price on a past sale.
4. **The audit log** — see everything that was corrected, in one list.

---

## Before you start: a 30-second mental model

Every correction in SariSari leaves a paper trail. Nothing in your records gets **deleted** when you void or refund. Instead, a correction entry is written that says "this sale was corrected on this date, by this owner, with this cashier watching, for this reason." The original sale stays in the history with a banner on it saying it was voided or refunded.

Why this matters to you:

- Your bookkeeper can see every change, who made it, and why.
- You can answer "what happened to that sale last Tuesday?" with a one-screen answer.
- If a cashier disputes a void, the record shows the witness who was on shift.

---

## Part 1 — Turn on the correction window (Settings)

The "void window" is the rule that says **how long after a sale you can still void it**. The default is 24 hours, but you can make it shorter or longer.

### Step 1.1 — Open Settings

1. From the **Sales** tab, tap the menu icon (top right).
2. Tap **Settings**.

### Step 1.2 — Find the "Void window" field

You will see a card labeled **"Void window (hours)"** with a number inside.

### Step 1.3 — Change the value

1. Tap the number and clear it.
2. Type the number of hours you want. Common choices:
   - `24` — you have a full day to catch mistakes (default).
   - `12` — tighter, for stores that close out fast.
   - `48` — looser, for stores with slow customer returns.
3. Tap **Save** at the bottom.
4. A small green toast saying "Saved" will appear.

### Step 1.4 — Try an invalid value (to see the safety check)

1. Tap the field and type `0` or `-5`.
2. Tap **Save**.
3. A red alert pops up: "Please enter a valid positive number of hours."
4. Tap OK. Nothing is saved. Your old value is still active.

**What you just confirmed:** the system will not let you accidentally set the void window to zero or a negative number.

---

## Part 2 — Void a cash sale (the "I rang it up wrong" case)

This is the most common correction. Use it when the cashier scanned the wrong item, gave too much change, or the customer changed their mind before leaving the store.

### Step 2.1 — Create a test sale first

1. Go to the **Sales** tab.
2. Add 1 Coke (or any product) to the cart.
3. Tap **Charge**.
4. Tap **Cash**.
5. Tap **Confirm sale**.
6. Note the sale number on the receipt (e.g., Sale #42).

### Step 2.2 — Open the sale detail screen

1. Go to **Sales** → **Receipts**.
2. Tap the sale you just made.
3. You see the sale detail with a **"Void sale"** button at the bottom.

### Step 2.3 — Start the void flow

1. Tap **Void sale**.
2. The screen title changes to **"Void sale"** in a brown header.
3. A summary card shows the sale number and the total.
4. Two fields appear: **Reason** and **Cashier on shift**.

### Step 2.4 — Pick a reason

1. Tap **Reason**. A list appears:
   - Customer changed mind
   - Misprinted price
   - Wrong item scanned
   - Other
2. For a test, tap **Wrong item scanned**.

### Step 2.5 — Enter the cashier on shift

1. Tap the **Cashier on shift** field.
2. Type the cashier's name, e.g., "Maria."
3. This is the **witness** — the person who was at the register with you. It is required. You cannot void without naming a witness.

### Step 2.6 — Confirm with your PIN

1. Tap **Confirm with PIN** (or the big brown button).
2. Your owner PIN screen appears. Enter your PIN.
3. After you confirm, the screen closes and a green toast says "Void recorded."

### Step 2.7 — Verify the void took effect

Go back to the sale detail. You should see:

- A red banner across the top: **"This sale was voided."**
- The sale is still in your history (not deleted), but it is marked.
- The Coke you voided is back in your inventory. To check: go to **Inventory** → find the Coke → the quantity has gone up by 1.
- The cash drawer math is adjusted: the expected cash for today's session is now lower by the sale's amount.

**What you just confirmed:** voiding a sale returns the item to your shelf AND removes the cash from your session total, while keeping a permanent record of why.

---

## Part 3 — Refund a sale (the "customer came back" case)

A refund is for when a customer actually returns the item — usually damaged or just because they changed their mind after leaving.

### Step 3.1 — Create a new test sale

1. Sell 1 item, take cash, confirm. (Same as Step 2.1.)

### Step 3.2 — Open the correction screen

1. Go to the sale detail.
2. Tap **Refund sale** (next to **Void sale**).

### Step 3.3 — Pick a refund reason

The reasons are different from void. You will see:

- **Returned — damaged** (the item was broken, expired, etc.)
- **Returned — other** (working item, customer just changed their mind)

Pick one.

### Step 3.4 — Enter witness and confirm with PIN

Same flow as void: name the cashier, enter PIN, confirm.

### Step 3.5 — Verify the refund

The sale detail now shows a different banner: **"This sale was refunded."** The item is back on the shelf, and the cash is removed from today's expected cash total. The audit log distinguishes between **void** and **refund** so you can tell at a glance which is which.

**What you just confirmed:** you have two distinct reasons for canceling a sale, and the record keeps them separate. A bookkeeper looking at the audit log later will know whether a sale never left the store (void) or whether the goods came back (refund).

---

## Part 4 — Price correction (the "I charged the wrong amount" case)

Sometimes the price on the shelf was wrong, or the cashier typed a price wrong. You can edit the price of a single line on a past sale without touching anything else.

### Step 4.1 — Create a test sale with at least 2 line items

1. Add a Coke (₱100) and a candy (₱20) to the cart.
2. Confirm the sale.
3. Total should be ₱120.

### Step 4.2 — Open the price correction screen

1. Go to the sale detail.
2. Tap **Correct price**.

### Step 4.3 — Edit a line

For each line on the sale you see:

- Product name
- Old price (e.g., "Old: ₱100.00")
- A number field on the right

1. Tap the number field on the Coke line.
2. Change it to `105` (₱105).
3. Leave the candy line alone.
4. The header recomputes the new total. After your edit, the new total is **₱125**.

### Step 4.4 — Pick a reason and witness

1. Pick **Misprinted price** as the reason.
2. Enter the cashier's name as the witness.

### Step 4.5 — Confirm with PIN

Tap **Confirm** and enter your PIN. A green toast says "Prices updated."

### Step 4.6 — Verify the price correction

1. Go back to the sale detail.
2. The Coke line now shows ₱105 instead of ₱100.
3. The total is now ₱125.
4. **There is no "voided" or "refunded" banner** — the sale is still valid. The price was just adjusted.
5. Open today's cash session. You will see a new line in the cash entries:
   - If you lowered the total (customer overpaid), it shows as a **Cash refund** for the difference.
   - If you raised the total (customer underpaid), it shows as an **Owner addition** for the difference.
6. The Corrections report (Part 5) shows this price correction as its own line, distinct from voids and refunds.

**What you just confirmed:** price corrections adjust the cash on hand to match reality, and they are flagged differently from voids and refunds in the audit log.

---

## Part 5 — Read the Corrections report (the audit log)

This is where you go when a bookkeeper, a co-owner, or your own future self asks: "What was corrected last week?"

### Step 5.1 — Open the report

1. From the **Sales** tab, tap the **Corrections** icon (top right, near the menu). It looks like a small clipboard.
2. If you have no corrections yet, you see a message: "No corrections yet."

### Step 5.2 — Read a line

Every line in the report tells you:

- **Kind** — VOID, REFUND, or PRICE CORRECTION (all caps for easy scanning)
- **Sale #** — which sale was corrected
- **Amount** — the sale's total at the moment of correction
- **By** — your owner name
- **Witness** — the cashier you named (or "(none)" if you skipped it — but the system asks you not to)
- **Reason** — the reason code you picked
- **Date** — when the correction happened

### Step 5.3 — Scroll through history

The list is newest first. Pull down to refresh. Scroll down to load older corrections (it loads 50 at a time).

### Step 5.4 — Tap a correction to see line details

If a correction was a price correction, tapping the line shows which item prices were changed and by how much. Voids and refunds show the items that were returned to stock.

**What you just confirmed:** every correction you make is recorded in a single, scrollable list. You never have to dig through receipts to answer "what did we change last week?"

---

## Part 6 — Try the refusal cases (so you know what the system will block)

These tests confirm the safety rails. Each one should be refused with a clear message.

### Test 6.1 — Try to void the same sale twice

1. Open a sale you already voided.
2. Tap **Void sale** again.
3. After you enter your PIN, a red error appears: "This sale has already been corrected."
4. Nothing is changed.

### Test 6.2 — Try to void an old sale past the window

1. Lower your void window in Settings to `1` hour.
2. Try to void a sale that is 2 hours old.
3. The system refuses: "Sale #N is outside the 1-hour correction window (2.0h since sale)."
4. Nothing is changed.

### Test 6.3 — Try to void while the cash session is closed

1. Close today's cash session (end of day).
2. Try to void a sale from today.
3. The system refuses: "This sale belongs to a closed cash session and cannot be corrected."
4. The void button is also disabled on the sale detail screen, so you would not have seen the option to try.

### Test 6.4 — Try to void with no cashier witness

1. Open the void screen.
2. Leave the "Cashier on shift" field blank.
3. Tap Confirm.
4. A red toast: "Pick the cashier who rang up the sale."
5. Nothing happens.

**What you just confirmed:** the system has four hard rules that protect your records. You cannot accidentally double-correct a sale, you cannot void a sale that is too old, you cannot change history after the cash is reconciled, and you cannot correct a sale without saying who was watching.

---

## Part 7 — After testing: clean up your test data

If you used real money for the test, your real cash session is now wrong. Two options:

- **Reverse your test void/refund** by creating a fresh sale and immediately voiding it the other direction — but this only works if the new "test" sale itself is inside the void window.
- **Open today's cash session and use "Owner addition" or "Owner drawing"** to manually adjust the expected cash to match the actual cash in the drawer, with a note in the description: "Test void during store-owner trial."

The audit log will still show the test corrections; you can leave them as a record of the trial, or note in your own bookkeeping that they were a test.

---

## Quick reference card

| Action                 | When to use it                              | What it does                                     | Audit log entry              |
| ---------------------- | ------------------------------------------- | ------------------------------------------------ | ---------------------------- |
| **Void**               | Sale never left the store                   | Restores stock, removes cash from session        | `VOID · Sale #N`             |
| **Refund**             | Customer came back with the item            | Restores stock, removes cash from session        | `REFUND · Sale #N`           |
| **Price correction**   | Shelf price was wrong, or cashier mis-keyed | Edits line price, adjusts cash by the difference | `PRICE CORRECTION · Sale #N` |
| **Corrections report** | "What did we change this week?"             | Scrollable audit log of all three above          | —                            |

### Things to remember

- **Nothing is deleted.** Your original sales stay in the system forever, marked as corrected.
- **You must enter your PIN** for every correction. The system will not let a cashier do this alone.
- **You must name a witness** — the cashier on shift. This is not optional.
- **There is a time window** for voids and refunds, set in Settings (default 24 hours). Price corrections have no time limit.
- **Closed cash sessions cannot be edited.** Once the day is closed, history is locked.

### Where to look if something looks wrong

| Symptom                                           | Where to check                                                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| "I voided a sale but the cash count is wrong."    | Today's cash session → look for a `Cash refund` line. It should match the voided total.                              |
| "I corrected a price but the inventory is wrong." | Price corrections **do not** change inventory. The item is still sold. Only the price changed.                       |
| "The Corrections report is empty."                | You have not done any corrections in the current app install. Old installs may have a separate history.              |
| "I can't void this sale."                         | The sale is either too old, already corrected, or belongs to a closed session. Look for a banner on the sale detail. |
| "I forgot who I named as witness."                | Tap the correction in the report — the witness name is on the line.                                                  |

---

## Feedback to give your technician

When you finish testing, tell your technician:

1. **Did any step feel confusing?** Note the step number.
2. **Was the PIN prompt in a surprising place?** Tell them where you expected it.
3. **Did you ever feel like you needed to add a note?** The system has a free-text "Note" field on each correction — try it. If it is hard to find, tell them.
4. **Did the audit log give you what you needed?** If you had to dig somewhere else for information that should have been there, write it down.
5. **Any sale that the system refused but you think should have been allowed?** Note the sale number, the message, and what you were trying to do.

This is the first version of the tool. Your feedback shapes the next version.

---

## Related notes

- [[02-Features/07-safe-voids-refunds-corrections|07. Safe Voids, Refunds & Corrections]] — the engineering spec for this feature.
- [[02-Features/11-owner-pin-for-sensitive-actions|11. Owner PIN for Sensitive Actions]] — explains why every correction asks for your PIN.
- [[02-Features/03-daily-cash-close-out|03. Daily Cash Close-Out]] — what the cash session math does when a sale is voided.
- [[02-Features/16-shift-tracking-on-one-device|16. Shift Tracking on One Device]] — where the "witness" cashier name comes from.
- [[02-Features/13-expiry-and-damaged-goods-tracking|13. Expiry and Damaged-Goods Tracking]] — shares the "returned — damaged" reason code.
