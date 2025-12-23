-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
-- This script enables RLS on all inventory tables
-- and creates policies to allow all operations
-- ============================================

-- Enable RLS on all tables
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE received_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE toner_stock ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on devices" ON devices;
DROP POLICY IF EXISTS "Allow all operations on received_items" ON received_items;
DROP POLICY IF EXISTS "Allow all operations on issued_items" ON issued_items;
DROP POLICY IF EXISTS "Allow all operations on toner_stock" ON toner_stock;

-- Create policies to allow all operations
-- (Adjust these based on your security requirements)

CREATE POLICY "Allow all operations on devices" 
    ON devices FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow all operations on received_items" 
    ON received_items FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow all operations on issued_items" 
    ON issued_items FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow all operations on toner_stock" 
    ON toner_stock FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Verify RLS is enabled
SELECT 
    tablename, 
    CASE 
        WHEN rowsecurity THEN 'Enabled' 
        ELSE 'Disabled' 
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('devices', 'received_items', 'issued_items', 'toner_stock')
ORDER BY tablename;

-- List all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('devices', 'received_items', 'issued_items', 'toner_stock')
ORDER BY tablename, policyname;

