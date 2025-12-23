# Remove Duplicate Stock Entries

## Overview
This script removes all duplicate stock entries, ensuring each toner model has only ONE stock entry. However, the same toner model can be issued to multiple users/printers.

## How It Works

### Stock (One Entry Per Model)
- Each toner model (e.g., "106A") has only ONE stock entry
- Stock quantity is tracked in a single entry
- When receiving items, quantity is added to the existing stock entry
- When issuing items, quantity is deducted from the same stock entry

### Issuing (Multiple Assignments Allowed)
- The same toner model can be issued to multiple users/printers
- Each issue creates a separate record in `issued_items` table
- Example: "106A" can be issued to:
  - User A with Printer 1
  - User B with Printer 2
  - User C with Printer 3
- All issues deduct from the same stock entry

## Running the Script

1. **Backup your database first!**

2. Run the script in Supabase SQL Editor:
   ```sql
   \i scripts/remove-duplicate-stock-entries.sql
   ```

3. The script will:
   - Show current duplicates
   - Consolidate quantities (sum all quantities for same model)
   - Keep the oldest entry for each model
   - Delete all duplicate entries
   - Update the unique constraint to enforce model-only uniqueness

4. Verify results:
   - Check that each model appears only once
   - Verify quantities are correctly consolidated
   - Confirm you can still issue the same toner to multiple users

## After Running

- Stock will have unique models only
- Receiving will update the single stock entry
- Issuing will allow multiple assignments (same toner to different users/printers)
- All operations will affect the correct single stock entry

## Example

**Before:**
- 106A - Printer 1 - Stock: 5
- 106A - Printer 2 - Stock: 3
- 106A - Printer 3 - Stock: 2

**After:**
- 106A - Stock: 10 (consolidated)

**Issuing (Still Allowed):**
- Issue 106A to User A (Printer 1) - Stock becomes 9
- Issue 106A to User B (Printer 2) - Stock becomes 8
- Issue 106A to User C (Printer 3) - Stock becomes 7

Each issue is a separate record, but all deduct from the same stock entry.

