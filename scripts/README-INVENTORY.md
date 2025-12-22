# Inventory Database Setup Guide

This guide explains how to set up the inventory management database tables for the Asset Register system.

## 📋 Prerequisites

- Supabase project created
- Database access (SQL Editor)
- Environment variables configured

## 🗄️ Database Tables

The inventory system requires three main tables:

1. **received_items** - Tracks all items received into inventory
2. **issued_items** - Tracks all items issued to users
3. **toner_stock** - Tracks current stock levels for toners by printer

## 📝 Setup Instructions

### Step 1: Create Base Tables (if not already done)

Run `scripts/01-create-tables.sql` to create the devices table with all required columns including `asset_number`.

### Step 2: Create Inventory Tables

Run `scripts/03-create-inventory-tables.sql` to create:
- `received_items` table
- `issued_items` table
- `toner_stock` table
- All necessary indexes
- Foreign key constraints
- Row Level Security policies
- Helper views for reporting

### Step 3: Seed Sample Data (Optional)

Run `scripts/04-seed-inventory-data.sql` to insert sample data for testing.

### Step 4: Verify Setup

Run queries from `scripts/05-inventory-queries.sql` to verify everything is working.

## 📊 Table Structures

### received_items
- Stores all items received into inventory
- Links toners to specific printers
- Tracks supplier information
- Supports color toner sets (Black, Cyan, Magenta, Yellow)

### issued_items
- Stores all items issued to users
- Links to printers and assets
- Tracks issue dates and recipients
- Supports color toner tracking

### toner_stock
- Tracks current stock levels
- One entry per model+color+printer combination
- Includes low stock thresholds
- Automatically updated when items are received/issued

## 🔗 Relationships

- `received_items.printer_id` → `devices.id` (printers)
- `issued_items.printer_id` → `devices.id` (printers)
- `issued_items.asset_id` → `devices.id` (any asset)
- `toner_stock.printer_id` → `devices.id` (printers)

## 🔍 Key Features

1. **Printer-Specific Stock**: Each printer has its own stock for each toner model and color
2. **Color Toner Support**: Tracks Black, Cyan, Magenta, Yellow, and Color Sets separately
3. **Automatic Stock Updates**: Stock is updated when items are received or issued
4. **Low Stock Alerts**: Configurable thresholds for stock warnings
5. **Full Audit Trail**: All receive and issue transactions are logged

## 📈 Useful Queries

See `scripts/05-inventory-queries.sql` for:
- Stock level reports
- Low stock alerts
- Receive/issue history
- Printer-specific reports
- Monthly summaries
- Stock reconciliation

## 🔒 Security

All tables have Row Level Security (RLS) enabled with policies allowing all operations. Adjust these policies based on your security requirements.

## 🚀 Next Steps

After running the setup scripts:
1. Verify tables are created in Supabase dashboard
2. Test receiving items through the UI
3. Test issuing items through the UI
4. Check toner stock page to see inventory levels
5. Run reports to verify data integrity

## ⚠️ Important Notes

- The `toner_stock` table uses a UNIQUE constraint on (model, color, printer_id)
- Stock is tracked per printer - same toner model for different printers are separate entries
- When a printer is deleted, associated stock entries are also deleted (CASCADE)
- All timestamps are automatically managed by triggers

