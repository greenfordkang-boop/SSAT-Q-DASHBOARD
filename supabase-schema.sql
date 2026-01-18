-- ============================================
-- SSAT Q-Dashboard Supabase 테이블 생성 스크립트
-- ============================================

-- 1. NCR Entries 테이블
CREATE TABLE IF NOT EXISTS ncr_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  source TEXT NOT NULL,
  customer TEXT NOT NULL,
  model TEXT NOT NULL,
  part_name TEXT NOT NULL,
  part_no TEXT NOT NULL,
  defect_content TEXT,
  outflow_cause TEXT,
  root_cause TEXT,
  countermeasure TEXT,
  plan_date TEXT,
  result_date TEXT,
  effectiveness_check TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  progress_rate INTEGER DEFAULT 0,
  remarks TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  eight_d_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NCR Entries 인덱스
CREATE INDEX IF NOT EXISTS idx_ncr_customer ON ncr_entries(customer);
CREATE INDEX IF NOT EXISTS idx_ncr_status ON ncr_entries(status);
CREATE INDEX IF NOT EXISTS idx_ncr_created ON ncr_entries(created_at DESC);

-- 2. Customer Metrics 테이블 (고객 품질 실적)
CREATE TABLE IF NOT EXISTS customer_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  customer TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  target NUMERIC NOT NULL DEFAULT 10,
  inspection_qty INTEGER NOT NULL DEFAULT 0,
  defects INTEGER NOT NULL DEFAULT 0,
  actual NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- ⭐ 중요: 중복 방지를 위한 UNIQUE 제약조건
  CONSTRAINT unique_customer_year_month UNIQUE (customer, year, month)
);

-- Customer Metrics 인덱스
CREATE INDEX IF NOT EXISTS idx_customer_metrics_customer ON customer_metrics(customer);
CREATE INDEX IF NOT EXISTS idx_customer_metrics_year ON customer_metrics(year);
CREATE INDEX IF NOT EXISTS idx_customer_metrics_month ON customer_metrics(month);

-- 3. Supplier Metrics 테이블 (수입검사 - 협력업체별 품질 지표)
CREATE TABLE IF NOT EXISTS supplier_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  supplier TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  target NUMERIC NOT NULL DEFAULT 7500,
  incoming_qty INTEGER NOT NULL DEFAULT 0,
  inspection_qty INTEGER NOT NULL DEFAULT 0,
  defects INTEGER NOT NULL DEFAULT 0,
  actual NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- ⭐ 중요: 중복 방지를 위한 UNIQUE 제약조건
  CONSTRAINT unique_supplier_year_month UNIQUE (supplier, year, month)
);

-- Supplier Metrics 인덱스
CREATE INDEX IF NOT EXISTS idx_supplier_metrics_supplier ON supplier_metrics(supplier);
CREATE INDEX IF NOT EXISTS idx_supplier_metrics_year ON supplier_metrics(year);
CREATE INDEX IF NOT EXISTS idx_supplier_metrics_month ON supplier_metrics(month);

-- 4. Outgoing Metrics 테이블 (출하 품질 실적)
CREATE TABLE IF NOT EXISTS outgoing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  target NUMERIC NOT NULL DEFAULT 10,
  inspection_qty INTEGER NOT NULL DEFAULT 0,
  defects INTEGER NOT NULL DEFAULT 0,
  actual NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- ⭐ 중요: 중복 방지를 위한 UNIQUE 제약조건
  CONSTRAINT unique_outgoing_year_month UNIQUE (year, month)
);

-- Outgoing Metrics 인덱스
CREATE INDEX IF NOT EXISTS idx_outgoing_metrics_year ON outgoing_metrics(year);
CREATE INDEX IF NOT EXISTS idx_outgoing_metrics_month ON outgoing_metrics(month);

-- 5. Quick Response Entries 테이블 (신속대응 추적표)
CREATE TABLE IF NOT EXISTS quick_response_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  department TEXT NOT NULL,
  machine_no TEXT,
  defect_count INTEGER NOT NULL DEFAULT 0,
  model TEXT NOT NULL,
  defect_type TEXT,
  process TEXT,
  defect_content TEXT,
  coating TEXT,
  area TEXT,
  material_code TEXT,
  shielding TEXT,
  action TEXT,
  material_manager TEXT,
  meeting_attendance TEXT,
  status_24h TEXT NOT NULL DEFAULT 'N/A',
  status_3d TEXT NOT NULL DEFAULT 'N/A',
  status_14day TEXT NOT NULL DEFAULT 'N/A',
  status_24d TEXT NOT NULL DEFAULT 'N/A',
  status_25d TEXT NOT NULL DEFAULT 'N/A',
  status_30d TEXT NOT NULL DEFAULT 'N/A',
  customer_mm TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quick Response Entries 인덱스
CREATE INDEX IF NOT EXISTS idx_quick_response_date ON quick_response_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_quick_response_department ON quick_response_entries(department);
CREATE INDEX IF NOT EXISTS idx_quick_response_model ON quick_response_entries(model);

-- 6. RLS (Row Level Security) 비활성화 (개발 환경)
-- 프로덕션에서는 RLS를 활성화하고 정책을 설정하세요
ALTER TABLE ncr_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE outgoing_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE quick_response_entries DISABLE ROW LEVEL SECURITY;

-- 4. Updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- NCR Entries 업데이트 트리거
DROP TRIGGER IF EXISTS update_ncr_entries_updated_at ON ncr_entries;
CREATE TRIGGER update_ncr_entries_updated_at
  BEFORE UPDATE ON ncr_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Customer Metrics 업데이트 트리거
DROP TRIGGER IF EXISTS update_customer_metrics_updated_at ON customer_metrics;
CREATE TRIGGER update_customer_metrics_updated_at
  BEFORE UPDATE ON customer_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Supplier Metrics 업데이트 트리거
DROP TRIGGER IF EXISTS update_supplier_metrics_updated_at ON supplier_metrics;
CREATE TRIGGER update_supplier_metrics_updated_at
  BEFORE UPDATE ON supplier_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Outgoing Metrics 업데이트 트리거
DROP TRIGGER IF EXISTS update_outgoing_metrics_updated_at ON outgoing_metrics;
CREATE TRIGGER update_outgoing_metrics_updated_at
  BEFORE UPDATE ON outgoing_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Quick Response Entries 업데이트 트리거
DROP TRIGGER IF EXISTS update_quick_response_entries_updated_at ON quick_response_entries;
CREATE TRIGGER update_quick_response_entries_updated_at
  BEFORE UPDATE ON quick_response_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Process Quality Upload History 테이블 (공정품질 업로드 이력)
CREATE TABLE IF NOT EXISTS process_quality_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Process Quality Uploads 인덱스
CREATE INDEX IF NOT EXISTS idx_pq_uploads_date ON process_quality_uploads(upload_date DESC);

-- 7. Process Quality Data 테이블 (공정품질 불량 데이터)
CREATE TABLE IF NOT EXISTS process_quality_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES process_quality_uploads(id) ON DELETE CASCADE,
  customer TEXT NOT NULL,
  part_type TEXT NOT NULL,
  production_qty INTEGER NOT NULL DEFAULT 0,
  defect_qty INTEGER NOT NULL DEFAULT 0,
  defect_amount NUMERIC NOT NULL DEFAULT 0,
  defect_rate NUMERIC NOT NULL DEFAULT 0,
  data_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Process Quality Data 인덱스
CREATE INDEX IF NOT EXISTS idx_pq_data_customer ON process_quality_data(customer);
CREATE INDEX IF NOT EXISTS idx_pq_data_part_type ON process_quality_data(part_type);
CREATE INDEX IF NOT EXISTS idx_pq_data_date ON process_quality_data(data_date DESC);
CREATE INDEX IF NOT EXISTS idx_pq_data_upload_id ON process_quality_data(upload_id);

-- RLS 비활성화
ALTER TABLE process_quality_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE process_quality_data DISABLE ROW LEVEL SECURITY;

-- Process Quality Data 업데이트 트리거
DROP TRIGGER IF EXISTS update_process_quality_data_updated_at ON process_quality_data;
CREATE TRIGGER update_process_quality_data_updated_at
  BEFORE UPDATE ON process_quality_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 완료!
-- ============================================
-- 이제 App에서 데이터 입력이 정상적으로 작동합니다.
