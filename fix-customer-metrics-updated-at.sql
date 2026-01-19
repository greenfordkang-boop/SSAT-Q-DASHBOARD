-- ============================================
-- Fix customer_metrics table missing updated_at column
-- ============================================
-- Run this script if you get error:
-- "Could not find the 'updated_at' column of 'customer_metrics' in the schema cache"
-- ============================================

-- Step 1: Check if the column exists (for verification)
-- You can run this query first to verify the issue:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'customer_metrics' AND column_name = 'updated_at';

-- Step 2: Add updated_at column if it doesn't exist
-- This will safely add the column without affecting existing data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_metrics'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE customer_metrics ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Column updated_at added to customer_metrics table';
  ELSE
    RAISE NOTICE 'Column updated_at already exists in customer_metrics table';
  END IF;
END $$;

-- Step 3: Add created_at column if it doesn't exist (just in case)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_metrics'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE customer_metrics ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Column created_at added to customer_metrics table';
  ELSE
    RAISE NOTICE 'Column created_at already exists in customer_metrics table';
  END IF;
END $$;

-- Step 4: Update existing rows to have current timestamps if they're NULL
UPDATE customer_metrics
SET updated_at = NOW()
WHERE updated_at IS NULL;

UPDATE customer_metrics
SET created_at = NOW()
WHERE created_at IS NULL;

-- Step 5: Ensure the trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Drop and recreate the trigger
DROP TRIGGER IF EXISTS update_customer_metrics_updated_at ON customer_metrics;
CREATE TRIGGER update_customer_metrics_updated_at
  BEFORE INSERT OR UPDATE ON customer_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Verify the fix
-- Run this query to verify the columns exist:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'customer_metrics'
AND column_name IN ('created_at', 'updated_at')
ORDER BY column_name;

-- Run this query to verify the trigger exists:
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'customer_metrics'
ORDER BY trigger_name;

-- ============================================
-- Instructions:
-- ============================================
-- 1. Copy this entire script
-- 2. Go to your Supabase dashboard
-- 3. Navigate to: SQL Editor
-- 4. Paste and run this script
-- 5. Verify the output shows successful column additions
-- 6. Try registering customer quality data again
-- ============================================
