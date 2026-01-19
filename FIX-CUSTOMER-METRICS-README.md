# 고객품질 등록 오류 수정 가이드

## 🚨 문제 증상

고객품질(Customer Quality) 데이터를 등록할 때 다음과 같은 오류가 발생합니다:

```
Could not find the 'updated_at' column of 'customer_metrics' in the schema cache
```

다른 품질 지표(수입검사, 출하품질 등)는 정상적으로 작동하지만, **고객품질만 등록이 안 되는 경우** 이 가이드를 따라주세요.

## 🔍 문제 원인

`customer_metrics` 테이블이 생성될 때 `updated_at` 컬럼이 누락되어 있어서 발생하는 문제입니다. 데이터베이스 트리거가 `updated_at` 컬럼을 자동으로 업데이트하려고 하는데, 컬럼 자체가 존재하지 않아 오류가 발생합니다.

## ✅ 해결 방법

### 방법 1: 자동 검증 도구 사용 (추천)

1. **`verify-customer-metrics-fix.html` 파일을 브라우저에서 엽니다**
   - 파일을 더블클릭하거나
   - 브라우저로 드래그 앤 드롭

2. **Supabase 정보 입력**
   - Supabase URL 입력: `https://your-project.supabase.co`
   - Supabase Anon Key 입력
   - 이 정보는 [Supabase Dashboard → Project Settings → API]에서 확인 가능

3. **"검증 시작" 버튼 클릭**
   - 자동으로 문제를 진단하고 결과를 보여줍니다
   - 문제가 확인되면 "해결 방법" 가이드를 따릅니다

### 방법 2: SQL 스크립트 직접 실행 (확실한 해결)

1. **Supabase 대시보드 접속**
   - [https://supabase.com](https://supabase.com) 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 사이드바에서 **SQL Editor** 클릭
   - **+ New query** 버튼 클릭

3. **수정 스크립트 복사 및 실행**
   - `fix-customer-metrics-updated-at.sql` 파일을 엽니다
   - 전체 내용을 복사합니다
   - SQL Editor에 붙여넣기
   - **Run** 버튼 클릭 (또는 Ctrl/Cmd + Enter)

4. **실행 결과 확인**
   - 성공 메시지가 표시되면 완료
   - "Column updated_at added to customer_metrics table" 메시지 확인

5. **애플리케이션에서 다시 시도**
   - 앱으로 돌아가서
   - 고객품질 데이터 등록을 다시 시도
   - 정상적으로 저장되어야 합니다

### 방법 3: 빠른 수동 수정

Supabase SQL Editor에서 다음 명령어만 실행:

```sql
-- 1. 컬럼 추가
ALTER TABLE customer_metrics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE customer_metrics ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. 기존 데이터 업데이트
UPDATE customer_metrics SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE customer_metrics SET created_at = NOW() WHERE created_at IS NULL;

-- 3. 트리거 재생성
DROP TRIGGER IF EXISTS update_customer_metrics_updated_at ON customer_metrics;
CREATE TRIGGER update_customer_metrics_updated_at
  BEFORE INSERT OR UPDATE ON customer_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 🧪 수정 확인 방법

### 1. 검증 도구로 확인
- `verify-customer-metrics-fix.html`을 다시 실행
- 모든 테스트가 "성공" 상태여야 함

### 2. 직접 SQL로 확인
Supabase SQL Editor에서 실행:

```sql
-- 컬럼 존재 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'customer_metrics'
AND column_name IN ('created_at', 'updated_at')
ORDER BY column_name;
```

결과: 2개 행이 반환되어야 함 (created_at, updated_at)

### 3. 앱에서 확인
1. 앱에서 "고객품질" 탭으로 이동
2. "실적 입력/등록" 버튼 클릭
3. 데이터 입력 후 "전산 데이터 등록 확정" 클릭
4. **"실적이 저장되었습니다."** 메시지가 표시되면 성공!

## 📋 관련 파일

| 파일명 | 용도 |
|--------|------|
| `fix-customer-metrics-updated-at.sql` | 수정 SQL 스크립트 (메인 해결책) |
| `verify-customer-metrics-fix.html` | 자동 검증 도구 (문제 진단용) |
| `SETUP.md` | 전체 데이터베이스 설정 가이드 |
| `supabase-schema.sql` | 전체 스키마 정의 (참고용) |

## ⚠️ 주의사항

1. **데이터 손실 없음**: 이 수정은 기존 데이터에 영향을 주지 않습니다
2. **여러 번 실행 가능**: 스크립트는 여러 번 실행해도 안전합니다 (멱등성 보장)
3. **다른 기능에 영향 없음**: 수입검사, 출하품질 등 다른 기능은 영향받지 않습니다

## 🆘 여전히 해결되지 않는 경우

1. **전체 스키마 재적용**
   - `supabase-schema.sql` 파일의 전체 내용을 Supabase SQL Editor에서 실행
   - 기존 테이블은 영향받지 않고, 누락된 부분만 추가됩니다

2. **브라우저 캐시 삭제**
   - F12 → Application → Clear storage
   - 페이지 새로고침 (Ctrl/Cmd + Shift + R)

3. **Supabase 프로젝트 상태 확인**
   - 프로젝트가 일시정지(paused) 상태가 아닌지 확인
   - API 키가 올바른지 확인 (anon/public key 사용)

4. **콘솔 로그 확인**
   - 브라우저에서 F12 → Console 탭
   - 구체적인 오류 메시지 확인
   - 오류 메시지를 이슈로 제보

## 📞 지원

문제가 계속되면:
- GitHub Issues에 오류 스크린샷과 함께 문의
- 브라우저 콘솔 로그 첨부
- Supabase SQL Editor에서 실행한 쿼리 결과 첨부

---

## Technical Details (개발자용)

### Root Cause
The `customer_metrics` table was created without the `updated_at` and `created_at` columns, but the database trigger `update_customer_metrics_updated_at` expects these columns to exist when inserting or updating records.

### Why This Happened
- Possible schema migration mismatch
- Table created manually without following the full schema
- Previous version of schema didn't include timestamp columns
- RLS policy or trigger created before columns were added

### The Fix
The fix script:
1. Uses `ALTER TABLE ADD COLUMN IF NOT EXISTS` to safely add missing columns
2. Sets default values for new columns
3. Updates existing rows to have valid timestamps
4. Recreates the trigger to ensure proper function
5. Uses DO blocks to prevent errors if columns already exist

### Testing
The verification tool (`verify-customer-metrics-fix.html`) performs:
1. Table accessibility test
2. Insert test with updated_at column
3. Automatic cleanup of test records
4. Trigger existence verification guide
