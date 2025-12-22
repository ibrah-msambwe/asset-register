-- ============================================
-- USEFUL QUERIES FOR INVENTORY MANAGEMENT
-- ============================================

-- ============================================
-- STOCK QUERIES
-- ============================================

-- Get all toner stock with printer details
SELECT 
  ts.id,
  ts.model,
  ts.color,
  ts.printer_name,
  ts.current_stock,
  ts.low_stock_threshold,
  ts.last_updated,
  CASE 
    WHEN ts.current_stock <= ts.low_stock_threshold THEN 'Low Stock'
    ELSE 'In Stock'
  END as status
FROM toner_stock ts
ORDER BY ts.model, ts.color, ts.printer_name;

-- Get low stock toners
SELECT 
  ts.model,
  ts.color,
  ts.printer_name,
  ts.current_stock,
  ts.low_stock_threshold,
  (ts.low_stock_threshold - ts.current_stock) as units_needed
FROM toner_stock ts
WHERE ts.current_stock <= ts.low_stock_threshold
ORDER BY ts.current_stock ASC;

-- Get stock summary by printer
SELECT 
  ts.printer_name,
  COUNT(DISTINCT ts.model) as unique_models,
  COUNT(*) as total_stock_entries,
  SUM(ts.current_stock) as total_units,
  SUM(CASE WHEN ts.current_stock <= ts.low_stock_threshold THEN 1 ELSE 0 END) as low_stock_count
FROM toner_stock ts
GROUP BY ts.printer_name
ORDER BY ts.printer_name;

-- ============================================
-- RECEIVED ITEMS QUERIES
-- ============================================

-- Get all received items with details
SELECT 
  ri.id,
  ri.item_type,
  ri.toner_model,
  ri.toner_color,
  ri.toner_type,
  ri.printer_name,
  ri.quantity,
  ri.supplier,
  ri.received_date,
  ri.notes,
  ri.created_at
FROM received_items ri
ORDER BY ri.received_date DESC, ri.created_at DESC;

-- Get received items by supplier
SELECT 
  ri.supplier,
  COUNT(*) as total_receipts,
  SUM(ri.quantity) as total_quantity,
  MIN(ri.received_date) as first_received,
  MAX(ri.received_date) as last_received
FROM received_items ri
GROUP BY ri.supplier
ORDER BY total_quantity DESC;

-- Get received toners by model and color
SELECT 
  ri.toner_model,
  ri.toner_color,
  ri.printer_name,
  SUM(ri.quantity) as total_received,
  COUNT(*) as receipt_count,
  MIN(ri.received_date) as first_received,
  MAX(ri.received_date) as last_received
FROM received_items ri
WHERE ri.item_type = 'Toner'
GROUP BY ri.toner_model, ri.toner_color, ri.printer_name
ORDER BY ri.toner_model, ri.toner_color;

-- ============================================
-- ISSUED ITEMS QUERIES
-- ============================================

-- Get all issued items with details
SELECT 
  ii.id,
  ii.item_type,
  ii.toner_model,
  ii.toner_color,
  ii.toner_type,
  ii.printer_name,
  ii.quantity,
  ii.issued_to,
  ii.issued_date,
  ii.notes,
  ii.created_at
FROM issued_items ii
ORDER BY ii.issued_date DESC, ii.created_at DESC;

-- Get issued items by user
SELECT 
  ii.issued_to,
  COUNT(*) as total_issues,
  SUM(ii.quantity) as total_quantity,
  MIN(ii.issued_date) as first_issue,
  MAX(ii.issued_date) as last_issue
FROM issued_items ii
GROUP BY ii.issued_to
ORDER BY total_quantity DESC;

-- Get issued toners by printer
SELECT 
  ii.printer_name,
  ii.toner_model,
  ii.toner_color,
  SUM(ii.quantity) as total_issued,
  COUNT(*) as issue_count,
  MIN(ii.issued_date) as first_issue,
  MAX(ii.issued_date) as last_issue
FROM issued_items ii
WHERE ii.item_type = 'Toner' AND ii.printer_id IS NOT NULL
GROUP BY ii.printer_name, ii.toner_model, ii.toner_color
ORDER BY ii.printer_name, ii.toner_model;

-- ============================================
-- INVENTORY ANALYSIS QUERIES
-- ============================================

-- Stock movement report (received vs issued)
SELECT 
  COALESCE(ri.toner_model, ii.toner_model) as toner_model,
  COALESCE(ri.toner_color, ii.toner_color) as toner_color,
  COALESCE(ri.printer_name, ii.printer_name) as printer_name,
  COALESCE(SUM(ri.quantity), 0) as total_received,
  COALESCE(SUM(ii.quantity), 0) as total_issued,
  COALESCE(SUM(ri.quantity), 0) - COALESCE(SUM(ii.quantity), 0) as net_quantity,
  COALESCE(ts.current_stock, 0) as current_stock
FROM received_items ri
FULL OUTER JOIN issued_items ii 
  ON ri.toner_model = ii.toner_model 
  AND ri.toner_color = ii.toner_color 
  AND ri.printer_id = ii.printer_id
LEFT JOIN toner_stock ts 
  ON COALESCE(ri.toner_model, ii.toner_model) = ts.model
  AND COALESCE(ri.toner_color, ii.toner_color) = ts.color
  AND COALESCE(ri.printer_id, ii.printer_id) = ts.printer_id
WHERE COALESCE(ri.item_type, ii.item_type) = 'Toner'
GROUP BY 
  COALESCE(ri.toner_model, ii.toner_model),
  COALESCE(ri.toner_color, ii.toner_color),
  COALESCE(ri.printer_name, ii.printer_name),
  COALESCE(ri.printer_id, ii.printer_id),
  ts.current_stock
ORDER BY printer_name, toner_model, toner_color;

-- Monthly inventory report
SELECT 
  DATE_TRUNC('month', ri.received_date) as month,
  ri.item_type,
  COUNT(*) as receipt_count,
  SUM(ri.quantity) as total_received
FROM received_items ri
GROUP BY DATE_TRUNC('month', ri.received_date), ri.item_type
ORDER BY month DESC, ri.item_type;

SELECT 
  DATE_TRUNC('month', ii.issued_date) as month,
  ii.item_type,
  COUNT(*) as issue_count,
  SUM(ii.quantity) as total_issued
FROM issued_items ii
GROUP BY DATE_TRUNC('month', ii.issued_date), ii.item_type
ORDER BY month DESC, ii.item_type;

-- ============================================
-- PRINTER-SPECIFIC QUERIES
-- ============================================

-- Get all toners for a specific printer
SELECT 
  ts.model,
  ts.color,
  ts.current_stock,
  ts.low_stock_threshold,
  ts.last_updated
FROM toner_stock ts
WHERE ts.printer_id = 'YOUR_PRINTER_ID_HERE'
ORDER BY ts.model, ts.color;

-- Get issue history for a specific printer
SELECT 
  ii.toner_model,
  ii.toner_color,
  ii.quantity,
  ii.issued_to,
  ii.issued_date,
  ii.notes
FROM issued_items ii
WHERE ii.printer_id = 'YOUR_PRINTER_ID_HERE'
ORDER BY ii.issued_date DESC;

-- Get receive history for a specific printer
SELECT 
  ri.toner_model,
  ri.toner_color,
  ri.quantity,
  ri.supplier,
  ri.received_date,
  ri.notes
FROM received_items ri
WHERE ri.printer_id = 'YOUR_PRINTER_ID_HERE'
ORDER BY ri.received_date DESC;

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Clean up orphaned stock entries (printers that no longer exist)
DELETE FROM toner_stock ts
WHERE ts.printer_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM devices d WHERE d.id = ts.printer_id
  );

-- Update stock counts based on received and issued items
-- (Use this if stock gets out of sync)
WITH stock_calc AS (
  SELECT 
    COALESCE(ri.toner_model, ii.toner_model) as model,
    COALESCE(ri.toner_color, ii.toner_color) as color,
    COALESCE(ri.printer_id, ii.printer_id) as printer_id,
    COALESCE(SUM(ri.quantity), 0) - COALESCE(SUM(ii.quantity), 0) as calculated_stock
  FROM received_items ri
  FULL OUTER JOIN issued_items ii 
    ON ri.toner_model = ii.toner_model 
    AND ri.toner_color = ii.toner_color 
    AND ri.printer_id = ii.printer_id
  WHERE COALESCE(ri.item_type, ii.item_type) = 'Toner'
  GROUP BY 
    COALESCE(ri.toner_model, ii.toner_model),
    COALESCE(ri.toner_color, ii.toner_color),
    COALESCE(ri.printer_id, ii.printer_id)
)
UPDATE toner_stock ts
SET current_stock = sc.calculated_stock,
    last_updated = CURRENT_DATE
FROM stock_calc sc
WHERE ts.model = sc.model
  AND COALESCE(ts.color, '') = COALESCE(sc.color, '')
  AND COALESCE(ts.printer_id::text, '') = COALESCE(sc.printer_id::text, '');

