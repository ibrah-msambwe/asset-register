# Database Schema Consolidation Guide

## Problem
Multiple SQL scripts have been run at different times, creating tables with inconsistent schemas:
- `03-create-inventory-tables.sql` - Creates `received_items` WITHOUT `received_by` column
- `00-complete-database-setup.sql` - Creates `received_items` WITH `received_by` column

This causes errors when the application tries to insert data into columns that don't exist.

## Solution Options

### Option 1: Consolidate Existing Tables (RECOMMENDED - Preserves Data)
Run `consolidate-database-schema.sql` to:
- Add missing columns (like `received_by`) to existing tables
- Fix constraints, triggers, and policies
- **Preserves all existing data**

```sql
-- Run this in your Supabase SQL Editor
\i scripts/consolidate-database-schema.sql
```

### Option 2: Clean Slate (DESTROYS ALL DATA)
If you want to start fresh, you can drop and recreate all tables:

**⚠️ WARNING: This will delete ALL data in these tables!**

```sql
-- Drop tables (in order due to foreign keys)
DROP TABLE IF EXISTS toner_stock CASCADE;
DROP TABLE IF EXISTS issued_items CASCADE;
DROP TABLE IF EXISTS received_items CASCADE;

-- Then run the complete setup
\i scripts/00-complete-database-setup.sql
```

## Recommended Approach

1. **First, try Option 1** (consolidation) - it's safe and preserves your data
2. **Verify** the schema is correct by checking if `received_by` column exists
3. **Test** adding a received item to ensure it works
4. Only use Option 2 if you're okay losing all data and starting fresh

## Verification

After running the consolidation script, verify the schema:

```sql
-- Check if received_by column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'received_items' 
ORDER BY ordinal_position;
```

You should see `received_by` in the list.

## Going Forward

**Always use `00-complete-database-setup.sql`** for new database setups. The other scripts (`01-create-tables.sql`, `03-create-inventory-tables.sql`) are now updated but should only be used if you understand their purpose.

