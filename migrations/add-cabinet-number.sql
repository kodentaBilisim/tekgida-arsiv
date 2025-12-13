-- Add cabinet_number column to folders table
ALTER TABLE folders ADD COLUMN IF NOT EXISTS cabinet_number VARCHAR(50);

-- Add index for faster searches
CREATE INDEX IF NOT EXISTS idx_folders_cabinet_number ON folders(cabinet_number);
