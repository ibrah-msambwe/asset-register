-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create devices table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_to ON devices(assigned_to);
CREATE INDEX IF NOT EXISTS idx_devices_serial_number ON devices(serial_number);
CREATE INDEX IF NOT EXISTS idx_devices_asset_number ON devices(asset_number);
CREATE INDEX IF NOT EXISTS idx_devices_created_at ON devices(created_at);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON devices
    FOR ALL USING (true);

-- Create policy to allow read access for anonymous users (for demo purposes)
CREATE POLICY "Allow read access for anonymous users" ON devices
    FOR SELECT USING (true);

-- Create policy to allow insert/update/delete for anonymous users (for demo purposes)
CREATE POLICY "Allow write access for anonymous users" ON devices
    FOR ALL USING (true);
