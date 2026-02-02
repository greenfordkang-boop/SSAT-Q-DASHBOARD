-- 부품단가표 테이블 생성 마이그레이션
-- Parts Price Tables Migration
-- Run this in Supabase SQL Editor

-- 1. 부품단가 업로드 이력 테이블
CREATE TABLE IF NOT EXISTS parts_price_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    record_count INTEGER DEFAULT 0,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 부품단가 데이터 테이블
CREATE TABLE IF NOT EXISTS parts_price_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES parts_price_uploads(id) ON DELETE CASCADE,
    part_code TEXT,
    part_name TEXT NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    customer TEXT,
    vehicle_model TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_parts_price_data_upload_id ON parts_price_data(upload_id);
CREATE INDEX IF NOT EXISTS idx_parts_price_data_part_name ON parts_price_data(part_name);
CREATE INDEX IF NOT EXISTS idx_parts_price_data_part_code ON parts_price_data(part_code);

-- 4. RLS (Row Level Security) 정책 설정
ALTER TABLE parts_price_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_price_data ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자에게 전체 접근 허용
CREATE POLICY "Allow all for authenticated users" ON parts_price_uploads
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON parts_price_data
    FOR ALL USING (true) WITH CHECK (true);

-- 5. updated_at 자동 갱신 트리거 (선택사항)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_parts_price_data_updated_at ON parts_price_data;
CREATE TRIGGER update_parts_price_data_updated_at
    BEFORE UPDATE ON parts_price_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 완료 메시지
SELECT '부품단가표 테이블 생성이 완료되었습니다.' as message;
