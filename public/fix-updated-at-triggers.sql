-- ============================================
-- Fix Missing updated_at Triggers
-- ============================================
-- Run this script if you get errors like:
-- - "record 'new' has no field 'updated_at'"
-- - "Could not find the 'updated_at' column in the schema cache"
-- ============================================

-- Step 1: Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 2: Drop existing triggers (if any)
DROP TRIGGER IF EXISTS update_ncr_entries_updated_at ON ncr_entries;
DROP TRIGGER IF EXISTS update_customer_metrics_updated_at ON customer_metrics;
DROP TRIGGER IF EXISTS update_supplier_metrics_updated_at ON supplier_metrics;
DROP TRIGGER IF EXISTS update_outgoing_metrics_updated_at ON outgoing_metrics;
DROP TRIGGER IF EXISTS update_quick_response_entries_updated_at ON quick_response_entries;
DROP TRIGGER IF EXISTS update_pq_data_updated_at ON process_quality_data;

-- Step 3: Create triggers for all tables
CREATE TRIGGER update_ncr_entries_updated_at
  BEFORE INSERT OR UPDATE ON ncr_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_metrics_updated_at
  BEFORE INSERT OR UPDATE ON customer_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_metrics_updated_at
  BEFORE INSERT OR UPDATE ON supplier_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outgoing_metrics_updated_at
  BEFORE INSERT OR UPDATE ON outgoing_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quick_response_entries_updated_at
  BEFORE INSERT OR UPDATE ON quick_response_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pq_data_updated_at
  BEFORE INSERT OR UPDATE ON process_quality_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Verify triggers are created
-- You can run this query to check:
-- SELECT trigger_name, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- ORDER BY event_object_table, trigger_name;
