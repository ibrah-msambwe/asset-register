# Row Level Security (RLS) Management Guide for Supabase

## What is Row Level Security (RLS)?

Row Level Security is a PostgreSQL feature that allows you to control access to individual rows in a table based on policies. When RLS is enabled, users can only see/modify rows that match the policies you define.

## Enable RLS on a Table

### Method 1: Using SQL (Recommended)

```sql
-- Enable RLS on a specific table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Examples:
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE received_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE toner_stock ENABLE ROW LEVEL SECURITY;
```

### Method 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** in the left sidebar
3. Click on the table you want to modify
4. Go to the **Settings** tab
5. Toggle **Enable Row Level Security** to ON

## Disable RLS on a Table

### Method 1: Using SQL (Recommended)

```sql
-- Disable RLS on a specific table
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Examples:
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE received_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE issued_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE toner_stock DISABLE ROW LEVEL SECURITY;
```

### Method 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** in the left sidebar
3. Click on the table you want to modify
4. Go to the **Settings** tab
5. Toggle **Enable Row Level Security** to OFF

## Check RLS Status

```sql
-- Check if RLS is enabled on a table
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'your_table_name';

-- Check all tables and their RLS status
SELECT 
    tablename, 
    CASE 
        WHEN rowsecurity THEN 'Enabled' 
        ELSE 'Disabled' 
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

## Important Notes

### ⚠️ When RLS is Enabled:
- **Without policies**: No one can access the table (even with service role key)
- **You MUST create policies** to allow access
- All queries are filtered by your policies

### ⚠️ When RLS is Disabled:
- **Anyone with API access** can read/write all data
- **Less secure** - use only for development or internal tools
- All rows are accessible without restrictions

## Common RLS Policies

### Allow All Operations (Development/Testing)

```sql
-- Create policy to allow all operations
CREATE POLICY "Allow all operations on table_name" 
    ON table_name FOR ALL 
    USING (true) 
    WITH CHECK (true);
```

### Allow Only Authenticated Users

```sql
-- Only authenticated users can access
CREATE POLICY "Allow authenticated users" 
    ON table_name FOR ALL 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');
```

### Allow Service Role Only

```sql
-- Only service role can access (for server-side operations)
CREATE POLICY "Allow service role" 
    ON table_name FOR ALL 
    USING (auth.role() = 'service_role') 
    WITH CHECK (auth.role() = 'service_role');
```

## Remove/Delete RLS Policies

```sql
-- Drop a specific policy
DROP POLICY IF EXISTS "policy_name" ON table_name;

-- Drop all policies on a table
-- (You need to drop them one by one, or use this query to generate drop statements)
SELECT 'DROP POLICY IF EXISTS "' || policyname || '" ON ' || tablename || ';' 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'your_table_name';
```

## Complete RLS Management Script

```sql
-- ============================================
-- ENABLE/DISABLE RLS FOR ALL INVENTORY TABLES
-- ============================================

-- DISABLE RLS (for development/testing)
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE received_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE issued_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE toner_stock DISABLE ROW LEVEL SECURITY;

-- ENABLE RLS (for production)
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE received_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE toner_stock ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REMOVE ALL POLICIES (if you want to start fresh)
-- ============================================

DROP POLICY IF EXISTS "Allow all operations on devices" ON devices;
DROP POLICY IF EXISTS "Allow all operations on received_items" ON received_items;
DROP POLICY IF EXISTS "Allow all operations on issued_items" ON issued_items;
DROP POLICY IF EXISTS "Allow all operations on toner_stock" ON toner_stock;

-- ============================================
-- RECREATE POLICIES (after enabling RLS)
-- ============================================

-- Devices table
CREATE POLICY "Allow all operations on devices" 
    ON devices FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Received items table
CREATE POLICY "Allow all operations on received_items" 
    ON received_items FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Issued items table
CREATE POLICY "Allow all operations on issued_items" 
    ON issued_items FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Toner stock table
CREATE POLICY "Allow all operations on toner_stock" 
    ON toner_stock FOR ALL 
    USING (true) 
    WITH CHECK (true);
```

## Quick Reference Commands

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Disable RLS
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- List all policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Drop a policy
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

## When to Disable RLS

- **Development/Testing**: Easier to test without policy complications
- **Internal Tools**: When you trust all API users
- **Migration Scripts**: When you need unrestricted access during setup

## When to Enable RLS

- **Production**: Always enable for production environments
- **Multi-tenant Apps**: When different users should see different data
- **Security Requirements**: When you need fine-grained access control

## Troubleshooting

### "Permission denied" errors
- RLS is enabled but no policies exist → Create policies
- Policies are too restrictive → Review and adjust policies

### Can't insert/update data
- Check if RLS is enabled
- Verify policies allow the operation (WITH CHECK clause)
- Check if you're using the correct API key (anon vs service_role)

### Want to bypass RLS temporarily
- Use the **service_role** key (bypasses RLS)
- Or disable RLS for that table temporarily

