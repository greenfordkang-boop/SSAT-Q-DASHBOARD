-- ============================================
-- Migration: Add vehicle_model and product_name columns
-- to process_quality_data table
-- ============================================

-- Add vehicle_model column if not exists
ALTER TABLE process_quality_data
ADD COLUMN IF NOT EXISTS vehicle_model TEXT;

-- Add product_name column if not exists
ALTER TABLE process_quality_data
ADD COLUMN IF NOT EXISTS product_name TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pq_data_vehicle_model
ON process_quality_data(vehicle_model);

CREATE INDEX IF NOT EXISTS idx_pq_data_product_name
ON process_quality_data(product_name);

-- ============================================
-- 완료!
-- ============================================
-- 이제 vehicle_model과 product_name 필드를 사용할 수 있습니다.
