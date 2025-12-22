-- ============================================
-- SAMPLE INVENTORY DATA
-- ============================================
-- This script inserts sample data for testing the inventory system
-- Make sure devices table has printers before running this

-- Sample received items
INSERT INTO received_items (
  item_type, 
  toner_model, 
  toner_color, 
  toner_type, 
  printer_id, 
  printer_name, 
  quantity, 
  supplier, 
  received_date, 
  notes
)
SELECT 
  'Toner' as item_type,
  'HP 85A' as toner_model,
  'Black' as toner_color,
  'Black & White' as toner_type,
  d.id as printer_id,
  CONCAT(COALESCE(d.asset_number, d.serial_number), ' - ', COALESCE(d.assigned_to, 'Unassigned')) as printer_name,
  20 as quantity,
  'Tech Supplies Ltd' as supplier,
  CURRENT_DATE - INTERVAL '30 days' as received_date,
  'Bulk order for Q1' as notes
FROM devices d
WHERE d.type = 'Printer' AND d.assigned_to IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO received_items (
  item_type, 
  toner_model, 
  toner_color, 
  toner_type, 
  printer_id, 
  printer_name, 
  quantity, 
  supplier, 
  received_date, 
  notes
)
SELECT 
  'Toner' as item_type,
  'HP 85A' as toner_model,
  'Cyan' as toner_color,
  'Color' as toner_type,
  d.id as printer_id,
  CONCAT(COALESCE(d.asset_number, d.serial_number), ' - ', COALESCE(d.assigned_to, 'Unassigned')) as printer_name,
  10 as quantity,
  'Tech Supplies Ltd' as supplier,
  CURRENT_DATE - INTERVAL '25 days' as received_date,
  'Color toner set' as notes
FROM devices d
WHERE d.type = 'Printer' AND d.assigned_to IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO received_items (
  item_type, 
  toner_model, 
  toner_color, 
  toner_type, 
  printer_id, 
  printer_name, 
  quantity, 
  supplier, 
  received_date, 
  notes
)
SELECT 
  'Toner' as item_type,
  'HP 85A' as toner_model,
  'Magenta' as toner_color,
  'Color' as toner_type,
  d.id as printer_id,
  CONCAT(COALESCE(d.asset_number, d.serial_number), ' - ', COALESCE(d.assigned_to, 'Unassigned')) as printer_name,
  10 as quantity,
  'Tech Supplies Ltd' as supplier,
  CURRENT_DATE - INTERVAL '25 days' as received_date,
  'Color toner set' as notes
FROM devices d
WHERE d.type = 'Printer' AND d.assigned_to IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO received_items (
  item_type, 
  toner_model, 
  toner_color, 
  toner_type, 
  printer_id, 
  printer_name, 
  quantity, 
  supplier, 
  received_date, 
  notes
)
SELECT 
  'Toner' as toner_model,
  'HP 85A' as toner_model,
  'Yellow' as toner_color,
  'Color' as toner_type,
  d.id as printer_id,
  CONCAT(COALESCE(d.asset_number, d.serial_number), ' - ', COALESCE(d.assigned_to, 'Unassigned')) as printer_name,
  10 as quantity,
  'Tech Supplies Ltd' as supplier,
  CURRENT_DATE - INTERVAL '25 days' as received_date,
  'Color toner set' as notes
FROM devices d
WHERE d.type = 'Printer' AND d.assigned_to IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO received_items (
  item_type, 
  quantity, 
  supplier, 
  received_date, 
  notes
)
VALUES 
  ('Keyboard', 10, 'Office Depot', CURRENT_DATE - INTERVAL '20 days', 'Wireless keyboards'),
  ('Mouse', 15, 'Office Depot', CURRENT_DATE - INTERVAL '18 days', 'Optical mice'),
  ('Cable', 25, 'Tech Supplies Ltd', CURRENT_DATE - INTERVAL '15 days', 'USB-C cables')
ON CONFLICT DO NOTHING;

-- Sample toner stock (will be auto-created when receiving, but adding some for reference)
INSERT INTO toner_stock (
  model, 
  color, 
  printer_id, 
  printer_name, 
  current_stock, 
  low_stock_threshold, 
  last_updated
)
SELECT 
  'HP 85A' as model,
  'Black' as color,
  d.id as printer_id,
  CONCAT(COALESCE(d.asset_number, d.serial_number), ' - ', COALESCE(d.assigned_to, 'Unassigned')) as printer_name,
  18 as current_stock,
  5 as low_stock_threshold,
  CURRENT_DATE - INTERVAL '5 days' as last_updated
FROM devices d
WHERE d.type = 'Printer' AND d.assigned_to IS NOT NULL
LIMIT 1
ON CONFLICT (model, color, printer_id) DO NOTHING;

INSERT INTO toner_stock (
  model, 
  color, 
  printer_id, 
  printer_name, 
  current_stock, 
  low_stock_threshold, 
  last_updated
)
SELECT 
  'HP 85A' as model,
  'Cyan' as color,
  d.id as printer_id,
  CONCAT(COALESCE(d.asset_number, d.serial_number), ' - ', COALESCE(d.assigned_to, 'Unassigned')) as printer_name,
  8 as current_stock,
  5 as low_stock_threshold,
  CURRENT_DATE - INTERVAL '5 days' as last_updated
FROM devices d
WHERE d.type = 'Printer' AND d.assigned_to IS NOT NULL
LIMIT 1
ON CONFLICT (model, color, printer_id) DO NOTHING;

-- Sample issued items
INSERT INTO issued_items (
  item_type, 
  toner_model, 
  toner_color, 
  toner_type, 
  printer_id, 
  printer_name, 
  quantity, 
  issued_to, 
  issued_date, 
  asset_id, 
  notes
)
SELECT 
  'Toner' as item_type,
  'HP 85A' as toner_model,
  'Black' as toner_color,
  'Black & White' as toner_type,
  d.id as printer_id,
  CONCAT(COALESCE(d.asset_number, d.serial_number), ' - ', COALESCE(d.assigned_to, 'Unassigned')) as printer_name,
  2 as quantity,
  d.assigned_to as issued_to,
  CURRENT_DATE - INTERVAL '5 days' as issued_date,
  d.id as asset_id,
  'For office printer' as notes
FROM devices d
WHERE d.type = 'Printer' AND d.assigned_to IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO issued_items (
  item_type, 
  quantity, 
  issued_to, 
  issued_date, 
  notes
)
VALUES 
  ('Keyboard', 2, 'John Doe', CURRENT_DATE - INTERVAL '10 days', 'For workstation setup'),
  ('Mouse', 3, 'Jane Smith', CURRENT_DATE - INTERVAL '8 days', 'Replacement mice')
ON CONFLICT DO NOTHING;

