-- ============================================
-- Migration: Add Painting and Assembly Defect Type Tables
-- Description: 도장 및 조립 불량유형 분석을 위한 테이블 추가
-- Date: 2026-01-20
-- ============================================

-- ============================================
-- 1. Painting Defect Type Tables (도장 불량유형)
-- ============================================

-- 1-1. Painting Defect Type Upload History 테이블
CREATE TABLE IF NOT EXISTS painting_defect_type_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Painting Defect Type Upload History 인덱스
CREATE INDEX IF NOT EXISTS idx_painting_uploads_date
  ON painting_defect_type_uploads(upload_date DESC);

-- Painting Defect Type Uploads RLS 비활성화
ALTER TABLE painting_defect_type_uploads DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE painting_defect_type_uploads IS '도장 불량유형 업로드 이력 테이블';
COMMENT ON COLUMN painting_defect_type_uploads.filename IS '업로드된 파일명';
COMMENT ON COLUMN painting_defect_type_uploads.record_count IS '업로드된 레코드 수';

-- 1-2. Painting Defect Type Data 테이블
CREATE TABLE IF NOT EXISTS painting_defect_type_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES painting_defect_type_uploads(id) ON DELETE CASCADE,
  customer TEXT,
  part_code TEXT,
  part_name TEXT,
  process TEXT,
  vehicle_model TEXT,
  defect_type_1 INTEGER DEFAULT 0,
  defect_type_2 INTEGER DEFAULT 0,
  defect_type_3 INTEGER DEFAULT 0,
  defect_type_4 INTEGER DEFAULT 0,
  defect_type_5 INTEGER DEFAULT 0,
  defect_type_6 INTEGER DEFAULT 0,
  defect_type_7 INTEGER DEFAULT 0,
  defect_type_8 INTEGER DEFAULT 0,
  defect_type_9 INTEGER DEFAULT 0,
  defect_type_10 INTEGER DEFAULT 0,
  defect_types_detail JSONB DEFAULT '{}'::jsonb,
  total_defects INTEGER DEFAULT 0,
  data_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Painting Defect Type Data 인덱스
CREATE INDEX IF NOT EXISTS idx_painting_data_upload
  ON painting_defect_type_data(upload_id);
CREATE INDEX IF NOT EXISTS idx_painting_data_customer
  ON painting_defect_type_data(customer);
CREATE INDEX IF NOT EXISTS idx_painting_data_process
  ON painting_defect_type_data(process);
CREATE INDEX IF NOT EXISTS idx_painting_data_part_code
  ON painting_defect_type_data(part_code);
CREATE INDEX IF NOT EXISTS idx_painting_data_date
  ON painting_defect_type_data(data_date DESC);

-- Painting Defect Type Data 업데이트 트리거
DROP TRIGGER IF EXISTS update_painting_data_updated_at ON painting_defect_type_data;
CREATE TRIGGER update_painting_data_updated_at
  BEFORE INSERT OR UPDATE ON painting_defect_type_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Painting Defect Type Data RLS 비활성화
ALTER TABLE painting_defect_type_data DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE painting_defect_type_data IS '도장 불량유형 상세 데이터';
COMMENT ON COLUMN painting_defect_type_data.defect_types_detail IS '불량유형별 상세 수량 (JSONB)';
COMMENT ON COLUMN painting_defect_type_data.total_defects IS '총 불량 수량';

-- ============================================
-- 2. Assembly Defect Type Tables (조립 불량유형)
-- ============================================

-- 2-1. Assembly Defect Type Upload History 테이블
CREATE TABLE IF NOT EXISTS assembly_defect_type_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assembly Defect Type Upload History 인덱스
CREATE INDEX IF NOT EXISTS idx_assembly_uploads_date
  ON assembly_defect_type_uploads(upload_date DESC);

-- Assembly Defect Type Uploads RLS 비활성화
ALTER TABLE assembly_defect_type_uploads DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE assembly_defect_type_uploads IS '조립 불량유형 업로드 이력 테이블';
COMMENT ON COLUMN assembly_defect_type_uploads.filename IS '업로드된 파일명';
COMMENT ON COLUMN assembly_defect_type_uploads.record_count IS '업로드된 레코드 수';

-- 2-2. Assembly Defect Type Data 테이블
CREATE TABLE IF NOT EXISTS assembly_defect_type_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES assembly_defect_type_uploads(id) ON DELETE CASCADE,
  customer TEXT,
  part_code TEXT,
  part_name TEXT,
  process TEXT,
  vehicle_model TEXT,
  defect_type_1 INTEGER DEFAULT 0,
  defect_type_2 INTEGER DEFAULT 0,
  defect_type_3 INTEGER DEFAULT 0,
  defect_type_4 INTEGER DEFAULT 0,
  defect_type_5 INTEGER DEFAULT 0,
  defect_type_6 INTEGER DEFAULT 0,
  defect_type_7 INTEGER DEFAULT 0,
  defect_type_8 INTEGER DEFAULT 0,
  defect_type_9 INTEGER DEFAULT 0,
  defect_type_10 INTEGER DEFAULT 0,
  defect_types_detail JSONB DEFAULT '{}'::jsonb,
  total_defects INTEGER DEFAULT 0,
  data_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assembly Defect Type Data 인덱스
CREATE INDEX IF NOT EXISTS idx_assembly_data_upload
  ON assembly_defect_type_data(upload_id);
CREATE INDEX IF NOT EXISTS idx_assembly_data_customer
  ON assembly_defect_type_data(customer);
CREATE INDEX IF NOT EXISTS idx_assembly_data_process
  ON assembly_defect_type_data(process);
CREATE INDEX IF NOT EXISTS idx_assembly_data_part_code
  ON assembly_defect_type_data(part_code);
CREATE INDEX IF NOT EXISTS idx_assembly_data_date
  ON assembly_defect_type_data(data_date DESC);

-- Assembly Defect Type Data 업데이트 트리거
DROP TRIGGER IF EXISTS update_assembly_data_updated_at ON assembly_defect_type_data;
CREATE TRIGGER update_assembly_data_updated_at
  BEFORE INSERT OR UPDATE ON assembly_defect_type_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Assembly Defect Type Data RLS 비활성화
ALTER TABLE assembly_defect_type_data DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE assembly_defect_type_data IS '조립 불량유형 상세 데이터';
COMMENT ON COLUMN assembly_defect_type_data.defect_types_detail IS '불량유형별 상세 수량 (JSONB)';
COMMENT ON COLUMN assembly_defect_type_data.total_defects IS '총 불량 수량';

-- ============================================
-- 3. Verification (검증)
-- ============================================

-- 테이블 생성 확인
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'painting_defect_type_uploads',
      'painting_defect_type_data',
      'assembly_defect_type_uploads',
      'assembly_defect_type_data'
    )
  ) THEN
    RAISE NOTICE '✅ 도장/조립 불량유형 테이블이 성공적으로 생성되었습니다.';
  ELSE
    RAISE NOTICE '❌ 일부 테이블 생성에 실패했습니다.';
  END IF;
END $$;

-- ============================================
-- Migration Complete!
-- ============================================
