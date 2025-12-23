-- ============================================
-- DATABASE SCHEMA CONSOLIDATION SCRIPT
-- ============================================
-- This script consolidates all tables to ensure they match the latest schema
-- It adds missing columns without dropping existing tables or data
-- Run this to fix any schema inconsistencies from running multiple setup scripts
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- FIX received_items TABLE
-- ============================================

-- Add received_by column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'received_items' AND column_name = 'received_by'
  ) THEN
    ALTER TABLE received_items ADD COLUMN received_by VARCHAR(255);
    COMMENT ON COLUMN received_items.received_by IS 'Name of the person who received the items';
  END IF;
END $$;

-- Ensure all other columns exist (in case of partial table creation)
DO $$ 
BEGIN
  -- Add supplier index if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'received_items' AND indexname = 'idx_received_items_supplier'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_received_items_supplier ON received_items(supplier);
  END IF;
END $$;

-- ============================================
-- FIX toner_stock TABLE
-- ============================================

-- Ensure unique constraint exists (might be named differently)
DO $$ 
BEGIN
  -- Drop old constraint if it exists with different name
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_toner_stock' AND contype = 'u'
  ) THEN
    -- Constraint already exists, do nothing
    NULL;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'toner_stock' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name != 'unique_toner_stock'
  ) THEN
    -- Drop the old constraint and add the correct one
    ALTER TABLE toner_stock DROP CONSTRAINT IF EXISTS toner_stock_model_color_printer_id_key;
    ALTER TABLE toner_stock DROP CONSTRAINT IF EXISTS toner_stock_pkey;
    ALTER TABLE toner_stock ADD CONSTRAINT unique_toner_stock UNIQUE(model, color, printer_id);
  ELSE
    -- Add the constraint if it doesn't exist
    ALTER TABLE toner_stock ADD CONSTRAINT unique_toner_stock UNIQUE(model, color, printer_id);
  END IF;
END $$;

-- ============================================
-- ENSURE ALL FOREIGN KEY CONSTRAINTS EXIST
-- ============================================

-- received_items foreign key
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'received_items' 
    AND constraint_name = 'fk_received_items_printer'
  ) THEN
    ALTER TABLE received_items 
    ADD CONSTRAINT fk_received_items_printer 
    FOREIGN KEY (printer_id) 
    REFERENCES devices(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- issued_items foreign keys
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'issued_items' 
    AND constraint_name = 'fk_issued_items_printer'
  ) THEN
    ALTER TABLE issued_items 
    ADD CONSTRAINT fk_issued_items_printer 
    FOREIGN KEY (printer_id) 
    REFERENCES devices(id) 
    ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'issued_items' 
    AND constraint_name = 'fk_issued_items_asset'
  ) THEN
    ALTER TABLE issued_items 
    ADD CONSTRAINT fk_issued_items_asset 
    FOREIGN KEY (asset_id) 
    REFERENCES devices(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- toner_stock foreign key
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'toner_stock' 
    AND constraint_name = 'fk_toner_stock_printer'
  ) THEN
    ALTER TABLE toner_stock 
    ADD CONSTRAINT fk_toner_stock_printer 
    FOREIGN KEY (printer_id) 
    REFERENCES devices(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- ENSURE TRIGGER FUNCTION EXISTS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- ENSURE ALL TRIGGERS EXIST
-- ============================================

-- Drop and recreate triggers to ensure they're correct
DROP TRIGGER IF EXISTS update_received_items_updated_at ON received_items;
CREATE TRIGGER update_received_items_updated_at 
    BEFORE UPDATE ON received_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_issued_items_updated_at ON issued_items;
CREATE TRIGGER update_issued_items_updated_at 
    BEFORE UPDATE ON issued_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_toner_stock_updated_at ON toner_stock;
CREATE TRIGGER update_toner_stock_updated_at 
    BEFORE UPDATE ON toner_stock 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENSURE ROW LEVEL SECURITY IS ENABLED
-- ============================================

ALTER TABLE received_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE toner_stock ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ENSURE RLS POLICIES EXIST
-- ============================================

-- Drop old policies and create new ones
DROP POLICY IF EXISTS "Allow all operations on received_items" ON received_items;
CREATE POLICY "Allow all operations on received_items" 
    ON received_items FOR ALL 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on issued_items" ON issued_items;
CREATE POLICY "Allow all operations on issued_items" 
    ON issued_items FOR ALL 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on toner_stock" ON toner_stock;
CREATE POLICY "Allow all operations on toner_stock" 
    ON toner_stock FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the schema is correct:

-- Check received_items columns
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'received_items' 
-- ORDER BY ordinal_position;

-- Check if received_by column exists
-- SELECT EXISTS (
--   SELECT 1 FROM information_schema.columns 
--   WHERE table_name = 'received_items' AND column_name = 'received_by'
-- ) AS received_by_exists;

-- ============================================
-- CONSOLIDATION COMPLETE
-- ============================================
-- All tables should now have the correct schema
-- The received_by column has been added to received_items if it was missing
-- All constraints, triggers, and policies have been verified/created
-- ============================================

