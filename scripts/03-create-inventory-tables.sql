-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- INVENTORY TABLES
-- ============================================

-- Create received_items table
CREATE TABLE IF NOT EXISTS received_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_type VARCHAR(50) NOT NULL,
  toner_model VARCHAR(100),
  toner_color VARCHAR(50),
  toner_type VARCHAR(50),
  printer_id UUID,
  printer_name VARCHAR(255),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  supplier VARCHAR(255) NOT NULL,
  received_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create issued_items table
CREATE TABLE IF NOT EXISTS issued_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_type VARCHAR(50) NOT NULL,
  toner_model VARCHAR(100),
  toner_color VARCHAR(50),
  toner_type VARCHAR(50),
  printer_id UUID,
  printer_name VARCHAR(255),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  issued_to VARCHAR(255) NOT NULL,
  issued_date DATE NOT NULL,
  asset_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create toner_stock table
CREATE TABLE IF NOT EXISTS toner_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model VARCHAR(100) NOT NULL,
  color VARCHAR(50),
  printer_id UUID,
  printer_name VARCHAR(255),
  current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Unique constraint: one stock entry per model+color+printer combination
  UNIQUE(model, color, printer_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes for received_items
CREATE INDEX IF NOT EXISTS idx_received_items_item_type ON received_items(item_type);
CREATE INDEX IF NOT EXISTS idx_received_items_toner_model ON received_items(toner_model);
CREATE INDEX IF NOT EXISTS idx_received_items_printer_id ON received_items(printer_id);
CREATE INDEX IF NOT EXISTS idx_received_items_received_date ON received_items(received_date);
CREATE INDEX IF NOT EXISTS idx_received_items_created_at ON received_items(created_at);

-- Indexes for issued_items
CREATE INDEX IF NOT EXISTS idx_issued_items_item_type ON issued_items(item_type);
CREATE INDEX IF NOT EXISTS idx_issued_items_toner_model ON issued_items(toner_model);
CREATE INDEX IF NOT EXISTS idx_issued_items_printer_id ON issued_items(printer_id);
CREATE INDEX IF NOT EXISTS idx_issued_items_issued_to ON issued_items(issued_to);
CREATE INDEX IF NOT EXISTS idx_issued_items_issued_date ON issued_items(issued_date);
CREATE INDEX IF NOT EXISTS idx_issued_items_asset_id ON issued_items(asset_id);
CREATE INDEX IF NOT EXISTS idx_issued_items_created_at ON issued_items(created_at);

-- Indexes for toner_stock
CREATE INDEX IF NOT EXISTS idx_toner_stock_model ON toner_stock(model);
CREATE INDEX IF NOT EXISTS idx_toner_stock_color ON toner_stock(color);
CREATE INDEX IF NOT EXISTS idx_toner_stock_printer_id ON toner_stock(printer_id);
CREATE INDEX IF NOT EXISTS idx_toner_stock_current_stock ON toner_stock(current_stock);
CREATE INDEX IF NOT EXISTS idx_toner_stock_last_updated ON toner_stock(last_updated);

-- ============================================
-- FOREIGN KEY CONSTRAINTS (Optional - for referential integrity)
-- ============================================

-- Link received_items to devices (printers)
ALTER TABLE received_items 
  ADD CONSTRAINT fk_received_items_printer 
  FOREIGN KEY (printer_id) 
  REFERENCES devices(id) 
  ON DELETE SET NULL;

-- Link issued_items to devices (printers/assets)
ALTER TABLE issued_items 
  ADD CONSTRAINT fk_issued_items_printer 
  FOREIGN KEY (printer_id) 
  REFERENCES devices(id) 
  ON DELETE SET NULL;

ALTER TABLE issued_items 
  ADD CONSTRAINT fk_issued_items_asset 
  FOREIGN KEY (asset_id) 
  REFERENCES devices(id) 
  ON DELETE SET NULL;

-- Link toner_stock to devices (printers)
ALTER TABLE toner_stock 
  ADD CONSTRAINT fk_toner_stock_printer 
  FOREIGN KEY (printer_id) 
  REFERENCES devices(id) 
  ON DELETE CASCADE;

-- ============================================
-- TRIGGERS FOR AUTO-UPDATING updated_at
-- ============================================

-- Trigger function for received_items
CREATE TRIGGER update_received_items_updated_at 
  BEFORE UPDATE ON received_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger function for issued_items
CREATE TRIGGER update_issued_items_updated_at 
  BEFORE UPDATE ON issued_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger function for toner_stock
CREATE TRIGGER update_toner_stock_updated_at 
  BEFORE UPDATE ON toner_stock 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all inventory tables
ALTER TABLE received_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE toner_stock ENABLE ROW LEVEL SECURITY;

-- Policies for received_items
CREATE POLICY "Allow all operations on received_items" 
  ON received_items FOR ALL USING (true);

-- Policies for issued_items
CREATE POLICY "Allow all operations on issued_items" 
  ON issued_items FOR ALL USING (true);

-- Policies for toner_stock
CREATE POLICY "Allow all operations on toner_stock" 
  ON toner_stock FOR ALL USING (true);

-- ============================================
-- UPDATE DEVICES TABLE (if asset_number doesn't exist)
-- ============================================

-- Add asset_number column to devices table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'devices' AND column_name = 'asset_number'
  ) THEN
    ALTER TABLE devices ADD COLUMN asset_number VARCHAR(20);
    CREATE INDEX IF NOT EXISTS idx_devices_asset_number ON devices(asset_number);
  END IF;
END $$;

-- Add model_number column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'devices' AND column_name = 'model_number'
  ) THEN
    ALTER TABLE devices ADD COLUMN model_number VARCHAR(100);
  END IF;
END $$;

-- Add department column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'devices' AND column_name = 'department'
  ) THEN
    ALTER TABLE devices ADD COLUMN department VARCHAR(100);
  END IF;
END $$;

-- Add warranty column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'devices' AND column_name = 'warranty'
  ) THEN
    ALTER TABLE devices ADD COLUMN warranty VARCHAR(100);
  END IF;
END $$;

-- ============================================
-- HELPER VIEWS FOR REPORTING
-- ============================================

-- View for toner stock summary
CREATE OR REPLACE VIEW toner_stock_summary AS
SELECT 
  model,
  color,
  printer_name,
  SUM(current_stock) as total_stock,
  COUNT(*) as stock_entries,
  MIN(low_stock_threshold) as min_threshold,
  MAX(last_updated) as last_updated
FROM toner_stock
GROUP BY model, color, printer_name;

-- View for issued items by printer
CREATE OR REPLACE VIEW issued_items_by_printer AS
SELECT 
  printer_id,
  printer_name,
  toner_model,
  toner_color,
  SUM(quantity) as total_issued,
  COUNT(*) as issue_count,
  MIN(issued_date) as first_issue_date,
  MAX(issued_date) as last_issue_date
FROM issued_items
WHERE item_type = 'Toner' AND printer_id IS NOT NULL
GROUP BY printer_id, printer_name, toner_model, toner_color;

-- View for received items summary
CREATE OR REPLACE VIEW received_items_summary AS
SELECT 
  item_type,
  toner_model,
  toner_color,
  printer_name,
  SUM(quantity) as total_received,
  COUNT(*) as receive_count,
  MIN(received_date) as first_received_date,
  MAX(received_date) as last_received_date
FROM received_items
WHERE item_type = 'Toner'
GROUP BY item_type, toner_model, toner_color, printer_name;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE received_items IS 'Stores all items received into inventory, especially toners linked to printers';
COMMENT ON TABLE issued_items IS 'Stores all items issued to users, with printer and asset linking';
COMMENT ON TABLE toner_stock IS 'Tracks current stock levels for each toner model, color, and printer combination';

COMMENT ON COLUMN received_items.printer_id IS 'Links to devices table - the printer this toner is assigned to';
COMMENT ON COLUMN issued_items.printer_id IS 'Links to devices table - the printer this toner was issued for';
COMMENT ON COLUMN toner_stock.printer_id IS 'Links to devices table - the printer this stock belongs to';
COMMENT ON COLUMN toner_stock.model IS 'Toner model name (e.g., HP 85A, Canon 303)';
COMMENT ON COLUMN toner_stock.color IS 'Toner color: Black, Cyan, Magenta, Yellow, or Color Set';
COMMENT ON COLUMN toner_stock.current_stock IS 'Current quantity in stock for this model+color+printer combination';

