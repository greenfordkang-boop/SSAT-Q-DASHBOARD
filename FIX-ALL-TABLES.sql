-- ============================================
-- 🚨 모든 테이블의 updated_at 문제 한 번에 해결
-- ============================================
-- 이 스크립트는 모든 테이블에 대해:
-- 1. updated_at, created_at 컬럼 추가 (없을 경우)
-- 2. 트리거 함수 생성
-- 3. 트리거 연결
-- ============================================

BEGIN;

-- ============================================
-- 1. 트리거 함수 생성 (모든 테이블에서 공유)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ 트리거 함수 생성 완료';

-- ============================================
-- 2. NCR Entries 테이블
-- ============================================
DO $$
BEGIN
    -- updated_at 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ncr_entries' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE ncr_entries ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ ncr_entries.updated_at 추가';
    END IF;

    -- created_at 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ncr_entries' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE ncr_entries ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ ncr_entries.created_at 추가';
    END IF;
END $$;

-- NULL 값 채우기
UPDATE ncr_entries SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE ncr_entries SET created_at = NOW() WHERE created_at IS NULL;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_ncr_entries_updated_at ON ncr_entries;
CREATE TRIGGER update_ncr_entries_updated_at
    BEFORE INSERT OR UPDATE ON ncr_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE '✅ ncr_entries 트리거 생성 완료';

-- ============================================
-- 3. Customer Metrics 테이블 (🚨 주요 문제 테이블)
-- ============================================
DO $$
BEGIN
    -- updated_at 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customer_metrics' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE customer_metrics ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '🎯 customer_metrics.updated_at 추가 (주요 수정)';
    ELSE
        RAISE NOTICE '✅ customer_metrics.updated_at 이미 존재';
    END IF;

    -- created_at 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customer_metrics' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE customer_metrics ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '🎯 customer_metrics.created_at 추가';
    ELSE
        RAISE NOTICE '✅ customer_metrics.created_at 이미 존재';
    END IF;
END $$;

-- NULL 값 채우기
UPDATE customer_metrics SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE customer_metrics SET created_at = NOW() WHERE created_at IS NULL;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_customer_metrics_updated_at ON customer_metrics;
CREATE TRIGGER update_customer_metrics_updated_at
    BEFORE INSERT OR UPDATE ON customer_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE '✅ customer_metrics 트리거 생성 완료';

-- ============================================
-- 4. Supplier Metrics 테이블
-- ============================================
DO $$
BEGIN
    -- updated_at 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'supplier_metrics' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE supplier_metrics ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ supplier_metrics.updated_at 추가';
    END IF;

    -- created_at 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'supplier_metrics' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE supplier_metrics ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ supplier_metrics.created_at 추가';
    END IF;
END $$;

-- NULL 값 채우기
UPDATE supplier_metrics SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE supplier_metrics SET created_at = NOW() WHERE created_at IS NULL;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_supplier_metrics_updated_at ON supplier_metrics;
CREATE TRIGGER update_supplier_metrics_updated_at
    BEFORE INSERT OR UPDATE ON supplier_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE '✅ supplier_metrics 트리거 생성 완료';

-- ============================================
-- 5. Outgoing Metrics 테이블
-- ============================================
DO $$
BEGIN
    -- updated_at 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'outgoing_metrics' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE outgoing_metrics ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ outgoing_metrics.updated_at 추가';
    END IF;

    -- created_at 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'outgoing_metrics' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE outgoing_metrics ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ outgoing_metrics.created_at 추가';
    END IF;
END $$;

-- NULL 값 채우기
UPDATE outgoing_metrics SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE outgoing_metrics SET created_at = NOW() WHERE created_at IS NULL;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_outgoing_metrics_updated_at ON outgoing_metrics;
CREATE TRIGGER update_outgoing_metrics_updated_at
    BEFORE INSERT OR UPDATE ON outgoing_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE '✅ outgoing_metrics 트리거 생성 완료';

-- ============================================
-- 6. Process Quality Data 테이블
-- ============================================
DO $$
BEGIN
    -- updated_at 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'process_quality_data' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE process_quality_data ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ process_quality_data.updated_at 추가';
    END IF;

    -- created_at 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'process_quality_data' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE process_quality_data ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ process_quality_data.created_at 추가';
    END IF;
END $$;

-- NULL 값 채우기
UPDATE process_quality_data SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE process_quality_data SET created_at = NOW() WHERE created_at IS NULL;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_pq_data_updated_at ON process_quality_data;
CREATE TRIGGER update_pq_data_updated_at
    BEFORE INSERT OR UPDATE ON process_quality_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE '✅ process_quality_data 트리거 생성 완료';

-- ============================================
-- 최종 검증
-- ============================================
DO $$
DECLARE
    table_rec RECORD;
    col_count INTEGER;
    trigger_count INTEGER;
    total_issues INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== 최종 검증 ===';
    RAISE NOTICE '';

    FOR table_rec IN
        SELECT unnest(ARRAY['ncr_entries', 'customer_metrics', 'supplier_metrics',
                           'outgoing_metrics', 'process_quality_data']) AS table_name
    LOOP
        -- 컬럼 확인
        SELECT COUNT(*) INTO col_count
        FROM information_schema.columns
        WHERE table_name = table_rec.table_name
        AND column_name IN ('created_at', 'updated_at');

        -- 트리거 확인
        SELECT COUNT(*) INTO trigger_count
        FROM information_schema.triggers
        WHERE event_object_table = table_rec.table_name
        AND trigger_name LIKE '%updated_at%';

        IF col_count = 2 AND trigger_count >= 1 THEN
            RAISE NOTICE '✅ % - 정상 (컬럼: %, 트리거: %)', table_rec.table_name, col_count, trigger_count;
        ELSE
            RAISE NOTICE '❌ % - 문제 있음 (컬럼: %/2, 트리거: %)', table_rec.table_name, col_count, trigger_count;
            total_issues := total_issues + 1;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    IF total_issues = 0 THEN
        RAISE NOTICE '🎉 모든 테이블이 정상적으로 설정되었습니다!';
        RAISE NOTICE '이제 데이터를 저장해보세요.';
    ELSE
        RAISE NOTICE '⚠️  % 개 테이블에 문제가 있습니다.', total_issues;
        RAISE NOTICE '위의 ❌ 표시된 테이블을 확인하세요.';
    END IF;
END $$;

COMMIT;

-- ============================================
-- 실행 방법:
-- ============================================
-- 1. Supabase SQL Editor 열기
-- 2. 이 스크립트 전체 복사
-- 3. 붙여넣기 후 "Run" 클릭
-- 4. "모든 테이블이 정상적으로 설정되었습니다" 확인
-- ============================================
