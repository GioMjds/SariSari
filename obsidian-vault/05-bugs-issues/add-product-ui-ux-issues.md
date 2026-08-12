# Add Product UI/UX Issues

1. **SKU vs Barcode** - when choosing either a auto-generated SKU or an barcode value, users has to toggle off first the `Auto-Generate` switch before they can scan barcode.
2. **Supplier Selection** - can't select an **supplier** in `add-product` screen route but in `edit-product` it works completely fine.
3. **Button Toggling**
	1. *Pricing & Profit*
		1. Button toggles are a bit misleading in buttons **Single** or **Disabled**, either they are pressable or not
		2. Colors are a bit odd too
	2. *Wholesale (Pakyaw) Tier*
		1. Spacing are a bit inconsistent
		2. Misleading English/Tagalog texts, not too understandable in first read
		3. **TextFields** sizes are inconsistent
4. **Keyboard Aware Scroll View** - especially in **Stock** part, when editing the initial stock quantity, the keyboard aware scroll view doesn't go above, the keyboard are blocking the view
5. **Add Product Submissions** - likely scenario in **SKU vs. Barcode** where it needs to toggle on the auto-generate in SKU before they submit an product.