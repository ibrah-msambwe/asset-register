-- ============================================
-- REMOVE DUPLICATE STOCK ENTRIES
-- ============================================
-- This script removes all duplicate stock entries by model
-- It consolidates quantities and keeps only one entry per model
-- ============================================

-- ============================================
-- REMOVE DUPLICATE STOCK ENTRIES
-- ============================================
-- This script removes all duplicate stock entries by model
-- It consolidates quantities and keeps only one entry per model
-- IMPORTANT: One toner model = One stock entry
-- But one toner can be issued to multiple users/printers
-- ============================================

-- Step 1: Show current duplicates (for verification before deletion)
SELECT 
    model,
    COUNT(*) as duplicate_count,
    SUM(current_stock) as total_stock,
    STRING_AGG(id::text, ', ') as duplicate_ids
FROM toner_stock
GROUP BY model
HAVING COUNT(*) > 1
ORDER BY model;

-- Step 2: Create a temporary table with consolidated data
CREATE TEMP TABLE consolidated_stock AS
SELECT 
    model,
    -- Keep the first entry's ID (oldest by created_at, or first by id)
    (SELECT id FROM toner_stock ts2 
     WHERE ts2.model = ts1.model 
     ORDER BY COALESCE(ts2.created_at, ts2.id::text::timestamp) ASC 
     LIMIT 1) as id_to_keep,
    -- Sum all quantities
    SUM(current_stock) as total_stock,
    -- Keep minimum threshold
    MIN(low_stock_threshold) as low_stock_threshold,
    -- Keep most recent update date
    MAX(last_updated) as last_updated,
    -- Keep first non-null color
    (SELECT color FROM toner_stock ts2 
     WHERE ts2.model = ts1.model AND ts2.color IS NOT NULL 
     LIMIT 1) as color,
    -- Keep first non-null printer info (optional - can be null)
    (SELECT printer_id FROM toner_stock ts2 
     WHERE ts2.model = ts1.model AND ts2.printer_id IS NOT NULL 
     LIMIT 1) as printer_id,
    (SELECT printer_name FROM toner_stock ts2 
     WHERE ts2.model = ts1.model AND ts2.printer_name IS NOT NULL 
     LIMIT 1) as printer_name
FROM toner_stock ts1
GROUP BY model;

-- Step 3: Update the kept entries with consolidated data
UPDATE toner_stock ts
SET 
    current_stock = cs.total_stock,
    low_stock_threshold = cs.low_stock_threshold,
    last_updated = cs.last_updated,
    color = COALESCE(ts.color, cs.color),
    printer_id = COALESCE(ts.printer_id, cs.printer_id),
    printer_name = COALESCE(ts.printer_name, cs.printer_name)
FROM consolidated_stock cs
WHERE ts.id = cs.id_to_keep;

-- Step 4: Delete all duplicate entries (keep only one per model)
DELETE FROM toner_stock
WHERE id NOT IN (
    SELECT id_to_keep FROM consolidated_stock
);

-- Step 5: Drop old unique constraints if they exist
ALTER TABLE toner_stock DROP CONSTRAINT IF EXISTS unique_toner_stock;
ALTER TABLE toner_stock DROP CONSTRAINT IF EXISTS toner_stock_model_color_printer_id_key;
ALTER TABLE toner_stock DROP CONSTRAINT IF EXISTS unique_toner_stock_model;

-- Step 6: Add new unique constraint on model only
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_toner_stock_model' AND contype = 'u'
    ) THEN
        ALTER TABLE toner_stock ADD CONSTRAINT unique_toner_stock_model UNIQUE(model);
    END IF;
END $$;

-- Step 7: Clean up temporary table
DROP TABLE IF EXISTS consolidated_stock;

-- Step 8: Verification - Check for remaining duplicates
SELECT 
    model,
    COUNT(*) as count,
    SUM(current_stock) as total_stock
FROM toner_stock
GROUP BY model
HAVING COUNT(*) > 1;

-- If the above query returns no rows, all duplicates have been removed!
-- Each model should now have exactly one stock entry.

-- Step 9: Show final stock summary
SELECT 
    model,
    color,
    printer_name,
    current_stock,
    low_stock_threshold,
    last_updated
FROM toner_stock
ORDER BY model;

