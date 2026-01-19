-- ============================================
-- 🚨 CRITICAL FIX: customer_metrics updated_at 컬럼 누락 문제 해결
-- ============================================
-- 에러: record "new" has no field "updated_at"
-- 원인: 트리거는 존재하지만 updated_at 컬럼이 실제 테이블에 없음
-- ============================================

-- ⭐ 중요: 이 스크립트를 Supabase SQL Editor에서 한 번에 실행하세요

-- Step 1: 현재 상태 확인 (문제 진단)
DO $$
DECLARE
    col_exists BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    -- updated_at 컬럼 존재 여부
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customer_metrics'
        AND column_name = 'updated_at'
    ) INTO col_exists;

    -- 트리거 존재 여부
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE event_object_table = 'customer_metrics'
        AND trigger_name = 'update_customer_metrics_updated_at'
    ) INTO trigger_exists;

    RAISE NOTICE '=== 현재 상태 ===';
    RAISE NOTICE 'updated_at 컬럼 존재: %', col_exists;
    RAISE NOTICE '트리거 존재: %', trigger_exists;
    RAISE NOTICE '';

    IF col_exists AND trigger_exists THEN
        RAISE NOTICE '✅ 정상 상태입니다. 문제가 지속되면 다른 원인을 확인하세요.';
    ELSIF NOT col_exists AND trigger_exists THEN
        RAISE NOTICE '🚨 문제 발견: 트리거는 있지만 컬럼이 없습니다 (현재 에러 원인)';
    ELSIF col_exists AND NOT trigger_exists THEN
        RAISE NOTICE '⚠️  컬럼은 있지만 트리거가 없습니다';
    ELSE
        RAISE NOTICE '⚠️  컬럼과 트리거 모두 없습니다';
    END IF;
END $$;

-- Step 2: updated_at 컬럼 추가 (안전하게)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customer_metrics'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE customer_metrics
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

        RAISE NOTICE '✅ updated_at 컬럼이 추가되었습니다';
    ELSE
        RAISE NOTICE '✅ updated_at 컬럼이 이미 존재합니다';
    END IF;
END $$;

-- Step 3: created_at 컬럼 추가 (혹시 없을 경우 대비)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customer_metrics'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE customer_metrics
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();

        RAISE NOTICE '✅ created_at 컬럼이 추가되었습니다';
    ELSE
        RAISE NOTICE '✅ created_at 컬럼이 이미 존재합니다';
    END IF;
END $$;

-- Step 4: 기존 데이터의 NULL 값 채우기
UPDATE customer_metrics
SET updated_at = NOW()
WHERE updated_at IS NULL;

UPDATE customer_metrics
SET created_at = NOW()
WHERE created_at IS NULL;

RAISE NOTICE '✅ 기존 데이터의 타임스탬프가 업데이트되었습니다';

-- Step 5: 트리거 함수 생성/업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ 트리거 함수가 생성/업데이트되었습니다';

-- Step 6: 트리거 재생성 (기존 것 삭제 후 새로 생성)
DROP TRIGGER IF EXISTS update_customer_metrics_updated_at ON customer_metrics;

CREATE TRIGGER update_customer_metrics_updated_at
    BEFORE INSERT OR UPDATE ON customer_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE '✅ 트리거가 재생성되었습니다';

-- Step 7: 최종 검증
DO $$
DECLARE
    col_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- 컬럼 확인
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'customer_metrics'
    AND column_name IN ('created_at', 'updated_at');

    -- 트리거 확인
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE event_object_table = 'customer_metrics'
    AND trigger_name = 'update_customer_metrics_updated_at';

    RAISE NOTICE '';
    RAISE NOTICE '=== 최종 검증 결과 ===';
    RAISE NOTICE '타임스탬프 컬럼 개수: % (기대값: 2)', col_count;
    RAISE NOTICE '트리거 개수: % (기대값: 1)', trigger_count;

    IF col_count = 2 AND trigger_count = 1 THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 모든 수정이 완료되었습니다!';
        RAISE NOTICE '이제 고객품질 데이터를 저장해보세요.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  예상치 못한 상태입니다. 수동 확인이 필요합니다.';
    END IF;
END $$;

-- Step 8: 상세 정보 조회 (확인용)
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_metrics'
AND column_name IN ('created_at', 'updated_at')
ORDER BY column_name;

SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'customer_metrics'
ORDER BY trigger_name;

-- ============================================
-- 📋 실행 방법:
-- ============================================
-- 1. 이 파일 전체 내용을 복사 (Ctrl+A, Ctrl+C)
-- 2. Supabase 대시보드 접속
-- 3. 왼쪽 메뉴에서 "SQL Editor" 클릭
-- 4. "+ New query" 버튼 클릭
-- 5. 복사한 내용 붙여넣기 (Ctrl+V)
-- 6. "Run" 버튼 클릭 (또는 Ctrl+Enter)
-- 7. 결과창에서 "모든 수정이 완료되었습니다" 메시지 확인
-- 8. 대시보드로 돌아가서 고객품질 데이터 저장 재시도
-- ============================================
