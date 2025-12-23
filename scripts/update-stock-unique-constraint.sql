-- ============================================
-- UPDATE STOCK UNIQUE CONSTRAINT
-- ============================================
-- This script changes the unique constraint from (model, color, printer_id)
-- to just (model) to ensure only one stock entry per toner model
-- ============================================

-- Drop the old unique constraint if it exists
ALTER TABLE toner_stock DROP CONSTRAINT IF EXISTS unique_toner_stock;
ALTER TABLE toner_stock DROP CONSTRAINT IF EXISTS toner_stock_model_color_printer_id_key;

-- Add new unique constraint on model only
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_toner_stock_model' AND contype = 'u'
  ) THEN
    ALTER TABLE toner_stock ADD CONSTRAINT unique_toner_stock_model UNIQUE(model);
  END IF;
END $$;

-- Verify the constraint
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'toner_stock'::regclass
AND contype = 'u';

