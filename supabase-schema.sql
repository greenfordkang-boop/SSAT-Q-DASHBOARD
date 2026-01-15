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

-- 3. RLS (Row Level Security) 비활성화 (개발 환경)
-- 프로덕션에서는 RLS를 활성화하고 정책을 설정하세요
ALTER TABLE ncr_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_metrics DISABLE ROW LEVEL SECURITY;

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

-- ============================================
-- 완료!
-- ============================================
-- 이제 App에서 데이터 입력이 정상적으로 작동합니다.
