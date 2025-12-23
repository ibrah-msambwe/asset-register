-- Migration: Add received_by column to received_items table
-- Run this script if your database already exists and you need to add the received_by column

-- Add the received_by column if it doesn't exist
ALTER TABLE received_items 
ADD COLUMN IF NOT EXISTS received_by VARCHAR(255);

-- Add a comment to document the column
COMMENT ON COLUMN received_items.received_by IS 'Name of the person who received the items';

