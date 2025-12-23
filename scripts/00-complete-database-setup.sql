-- ============================================
-- COMPLETE DATABASE SETUP FOR ASSET REGISTER
-- Hesu Investment Limited
-- ============================================
-- This script creates all necessary tables, indexes, constraints,
-- triggers, and security policies for the asset register system.
-- Run this script in your Supabase SQL Editor.
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: devices
-- ============================================
-- Stores all IT assets (computers, printers, scanners, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  serial_number VARCHAR(100) NOT NULL UNIQUE,
  asset_number VARCHAR(20),
  model_number VARCHAR(100),
  assigned_to VARCHAR(100),
  status VARCHAR(50) NOT NULL,
  date_assigned DATE,
  department VARCHAR(100),
  warranty VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for devices table
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_to ON devices(assigned_to);
CREATE INDEX IF NOT EXISTS idx_devices_serial_number ON devices(serial_number);
CREATE INDEX IF NOT EXISTS idx_devices_asset_number ON devices(asset_number);
CREATE INDEX IF NOT EXISTS idx_devices_created_at ON devices(created_at);
CREATE INDEX IF NOT EXISTS idx_devices_department ON devices(department);

-- ============================================
-- TABLE: received_items
-- ============================================
-- Tracks all items received into inventory
-- Supports toners (with color tracking) and other items
-- ============================================

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
  received_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_received_items_printer FOREIGN KEY (printer_id) REFERENCES devices(id) ON DELETE SET NULL
);

-- Indexes for received_items table
CREATE INDEX IF NOT EXISTS idx_received_items_item_type ON received_items(item_type);
CREATE INDEX IF NOT EXISTS idx_received_items_toner_model ON received_items(toner_model);
CREATE INDEX IF NOT EXISTS idx_received_items_printer_id ON received_items(printer_id);
CREATE INDEX IF NOT EXISTS idx_received_items_received_date ON received_items(received_date);
CREATE INDEX IF NOT EXISTS idx_received_items_supplier ON received_items(supplier);
CREATE INDEX IF NOT EXISTS idx_received_items_created_at ON received_items(created_at);

-- ============================================
-- TABLE: issued_items
-- ============================================
-- Tracks all items issued to users
-- Links to printers and other assets
-- ============================================

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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_issued_items_printer FOREIGN KEY (printer_id) REFERENCES devices(id) ON DELETE SET NULL,
  CONSTRAINT fk_issued_items_asset FOREIGN KEY (asset_id) REFERENCES devices(id) ON DELETE SET NULL
);

-- Indexes for issued_items table
CREATE INDEX IF NOT EXISTS idx_issued_items_item_type ON issued_items(item_type);
CREATE INDEX IF NOT EXISTS idx_issued_items_toner_model ON issued_items(toner_model);
CREATE INDEX IF NOT EXISTS idx_issued_items_printer_id ON issued_items(printer_id);
CREATE INDEX IF NOT EXISTS idx_issued_items_issued_to ON issued_items(issued_to);
CREATE INDEX IF NOT EXISTS idx_issued_items_issued_date ON issued_items(issued_date);
CREATE INDEX IF NOT EXISTS idx_issued_items_asset_id ON issued_items(asset_id);
CREATE INDEX IF NOT EXISTS idx_issued_items_created_at ON issued_items(created_at);

-- ============================================
-- TABLE: toner_stock
-- ============================================
-- Tracks current stock levels for toners
-- One entry per model+color+printer combination
-- ============================================

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
  CONSTRAINT unique_toner_stock UNIQUE(model, color, printer_id),
  CONSTRAINT fk_toner_stock_printer FOREIGN KEY (printer_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Indexes for toner_stock table
CREATE INDEX IF NOT EXISTS idx_toner_stock_model ON toner_stock(model);
CREATE INDEX IF NOT EXISTS idx_toner_stock_color ON toner_stock(color);
CREATE INDEX IF NOT EXISTS idx_toner_stock_printer_id ON toner_stock(printer_id);
CREATE INDEX IF NOT EXISTS idx_toner_stock_current_stock ON toner_stock(current_stock);
CREATE INDEX IF NOT EXISTS idx_toner_stock_last_updated ON toner_stock(last_updated);

-- ============================================
-- TRIGGER FUNCTION: Auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS: Auto-update updated_at on all tables
-- ============================================

-- Devices table trigger
DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Received items table trigger
DROP TRIGGER IF EXISTS update_received_items_updated_at ON received_items;
CREATE TRIGGER update_received_items_updated_at 
    BEFORE UPDATE ON received_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Issued items table trigger
DROP TRIGGER IF EXISTS update_issued_items_updated_at ON issued_items;
CREATE TRIGGER update_issued_items_updated_at 
    BEFORE UPDATE ON issued_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Toner stock table trigger
DROP TRIGGER IF EXISTS update_toner_stock_updated_at ON toner_stock;
CREATE TRIGGER update_toner_stock_updated_at 
    BEFORE UPDATE ON toner_stock 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE received_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE toner_stock ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: devices table
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on devices" ON devices;
DROP POLICY IF EXISTS "Allow read access on devices" ON devices;
DROP POLICY IF EXISTS "Allow write access on devices" ON devices;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON devices;
DROP POLICY IF EXISTS "Allow read access for anonymous users" ON devices;
DROP POLICY IF EXISTS "Allow write access for anonymous users" ON devices;

-- Policy: Allow all operations (adjust based on your security requirements)
-- For production, you may want to restrict this to authenticated users only
CREATE POLICY "Allow all operations on devices" 
    ON devices FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- ============================================
-- RLS POLICIES: received_items table
-- ============================================

DROP POLICY IF EXISTS "Allow all operations on received_items" ON received_items;

CREATE POLICY "Allow all operations on received_items" 
    ON received_items FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- ============================================
-- RLS POLICIES: issued_items table
-- ============================================

DROP POLICY IF EXISTS "Allow all operations on issued_items" ON issued_items;

CREATE POLICY "Allow all operations on issued_items" 
    ON issued_items FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- ============================================
-- RLS POLICIES: toner_stock table
-- ============================================

DROP POLICY IF EXISTS "Allow all operations on toner_stock" ON toner_stock;

CREATE POLICY "Allow all operations on toner_stock" 
    ON toner_stock FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- ============================================
-- HELPER VIEWS FOR REPORTING
-- ============================================

-- View: Toner stock summary
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

-- View: Issued items by printer
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

-- View: Received items summary
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
-- TABLE COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE devices IS 'Stores all IT assets including computers, printers, scanners, and other devices';
COMMENT ON TABLE received_items IS 'Tracks all items received into inventory, especially toners linked to specific printers';
COMMENT ON TABLE issued_items IS 'Tracks all items issued to users, with printer and asset linking for toners';
COMMENT ON TABLE toner_stock IS 'Tracks current stock levels for each toner model, color, and printer combination';

COMMENT ON COLUMN devices.asset_number IS 'Auto-generated asset number (HD0001-HD1000)';
COMMENT ON COLUMN devices.type IS 'Device type: Computer, Laptop, Printer, Scanner, etc.';
COMMENT ON COLUMN received_items.printer_id IS 'Links to devices table - the printer this toner is assigned to';
COMMENT ON COLUMN issued_items.printer_id IS 'Links to devices table - the printer this toner was issued for';
COMMENT ON COLUMN toner_stock.printer_id IS 'Links to devices table - the printer this stock belongs to';
COMMENT ON COLUMN toner_stock.model IS 'Toner model name (e.g., HP 85A, Canon 303) - can be any custom name';
COMMENT ON COLUMN toner_stock.color IS 'Toner color: Black, Cyan, Magenta, Yellow, or Color Set';
COMMENT ON COLUMN toner_stock.current_stock IS 'Current quantity in stock for this model+color+printer combination';

-- ============================================
-- VALIDATION FUNCTIONS (Optional - for data integrity)
-- ============================================

-- Function to validate device status
CREATE OR REPLACE FUNCTION validate_device_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status NOT IN ('Active', 'Available', 'Maintenance', 'Inactive') THEN
        RAISE EXCEPTION 'Invalid device status: %', NEW.status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate device status
DROP TRIGGER IF EXISTS validate_device_status_trigger ON devices;
CREATE TRIGGER validate_device_status_trigger
    BEFORE INSERT OR UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION validate_device_status();

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- All tables, indexes, constraints, triggers, and security policies have been created.
-- 
-- Next steps:
-- 1. Verify tables in Supabase dashboard
-- 2. Test inserting data through the application
-- 3. Review and adjust RLS policies based on your security requirements
-- 4. Run seed data script if needed (scripts/04-seed-inventory-data.sql)
-- ============================================

