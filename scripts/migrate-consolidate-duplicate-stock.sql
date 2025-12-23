-- ============================================
-- MIGRATION: Consolidate Duplicate Toner Stock Entries
-- ============================================
-- This script consolidates duplicate stock entries by model
-- It keeps the first entry for each model and merges quantities
-- Run this to fix duplicate stock entries
-- ============================================

-- Step 1: Create a temporary table with consolidated stock
CREATE TEMP TABLE consolidated_stock AS
SELECT 
  model,
  MIN(id) as id_to_keep,
  SUM(current_stock) as total_stock,
  MIN(low_stock_threshold) as low_stock_threshold,
  MAX(last_updated) as last_updated,
  -- Keep the first non-null values
  (SELECT color FROM toner_stock ts2 WHERE ts2.model = ts1.model AND ts2.color IS NOT NULL LIMIT 1) as color,
  (SELECT printer_id FROM toner_stock ts2 WHERE ts2.model = ts1.model AND ts2.printer_id IS NOT NULL LIMIT 1) as printer_id,
  (SELECT printer_name FROM toner_stock ts2 WHERE ts2.model = ts1.model AND ts2.printer_name IS NOT NULL LIMIT 1) as printer_name
FROM toner_stock ts1
GROUP BY model;

-- Step 2: Delete all duplicate entries (keep only one per model)
DELETE FROM toner_stock
WHERE id NOT IN (
  SELECT id_to_keep FROM consolidated_stock
);

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

-- Step 4: Drop the old unique constraint if it exists
ALTER TABLE toner_stock DROP CONSTRAINT IF EXISTS unique_toner_stock;
ALTER TABLE toner_stock DROP CONSTRAINT IF EXISTS toner_stock_model_color_printer_id_key;

-- Step 5: Add new unique constraint on model only
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_toner_stock_model' AND contype = 'u'
  ) THEN
    ALTER TABLE toner_stock ADD CONSTRAINT unique_toner_stock_model UNIQUE(model);
  END IF;
END $$;

-- Step 6: Clean up temporary table
DROP TABLE IF EXISTS consolidated_stock;

-- Verification: Check for remaining duplicates
SELECT model, COUNT(*) as count
FROM toner_stock
GROUP BY model
HAVING COUNT(*) > 1;

-- If the above query returns no rows, the migration was successful!
-- Each model should now have only one stock entry.

