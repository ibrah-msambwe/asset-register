-- ============================================
-- DISABLE ROW LEVEL SECURITY (RLS)
-- ============================================
-- This script disables RLS on all inventory tables
-- Use this for development or when you want unrestricted access
-- ============================================

-- Disable RLS on all tables
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE received_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE issued_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE toner_stock DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
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

-- Note: Policies remain in the database but are not enforced when RLS is disabled
-- You can drop them if you want:
-- DROP POLICY IF EXISTS "Allow all operations on devices" ON devices;
-- DROP POLICY IF EXISTS "Allow all operations on received_items" ON received_items;
-- DROP POLICY IF EXISTS "Allow all operations on issued_items" ON issued_items;
-- DROP POLICY IF EXISTS "Allow all operations on toner_stock" ON toner_stock;

