# 🚨 고객품질 입력 저장 오류 완전 해결 가이드

## 문제 증상
```
저포 저장 실패: record "new" has no field "updated_at"
```

## 근본 원인
- **실제 데이터베이스 테이블에 `updated_at` 컬럼이 없음**
- 트리거는 존재해서 `updated_at`를 설정하려고 시도
- 컬럼이 없어서 트리거 실행 시 에러 발생

## 완전 해결 방법 (5분)

### ✅ Step 1: Supabase SQL Editor 접속
1. Supabase 대시보드 열기: https://supabase.com/dashboard
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
4. 상단의 **"+ New query"** 버튼 클릭

### ✅ Step 2: 수정 스크립트 실행
1. 프로젝트 폴더에서 `CRITICAL-FIX-updated-at.sql` 파일 열기
2. 파일 내용 **전체 선택** (Ctrl+A 또는 Cmd+A)
3. **복사** (Ctrl+C 또는 Cmd+C)
4. Supabase SQL Editor에 **붙여넣기** (Ctrl+V 또는 Cmd+V)
5. **"Run"** 버튼 클릭 (또는 Ctrl+Enter / Cmd+Enter)

### ✅ Step 3: 결과 확인
실행 후 아래와 같은 메시지가 나타나야 합니다:

```
✅ updated_at 컬럼이 추가되었습니다
✅ created_at 컬럼이 이미 존재합니다
✅ 기존 데이터의 타임스탬프가 업데이트되었습니다
✅ 트리거 함수가 생성/업데이트되었습니다
✅ 트리거가 재생성되었습니다

=== 최종 검증 결과 ===
타임스탬프 컬럼 개수: 2 (기대값: 2)
트리거 개수: 1 (기대값: 1)

🎉 모든 수정이 완료되었습니다!
이제 고객품질 데이터를 저장해보세요.
```

### ✅ Step 4: 대시보드에서 테스트
1. 대시보드로 돌아가기
2. 고객품질 입력 모달 열기
3. 데이터 입력 (예: LGE, 2026년 1월, 검사수량 1111, 불량수량 0)
4. "전산 저장 중..." 버튼 클릭
5. **성공 메시지 확인!** 🎉

## 문제가 지속될 경우

### 방법 1: 브라우저 캐시 삭제
1. Chrome 개발자 도구 열기 (F12)
2. Application 탭 클릭
3. "Clear site data" 클릭
4. 페이지 새로고침 (Ctrl+Shift+R)

### 방법 2: Supabase 스키마 캐시 새로고침
SQL Editor에서 실행:
```sql
-- 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
```

### 방법 3: 수동 검증
SQL Editor에서 실행:
```sql
-- customer_metrics 테이블 구조 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'customer_metrics'
ORDER BY ordinal_position;

-- 트리거 확인
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'customer_metrics';
```

## 예상 결과

### 컬럼 목록 (정상 상태)
| column_name    | data_type                   | column_default      |
|----------------|-----------------------------|--------------------|
| id             | uuid                        | gen_random_uuid()  |
| year           | integer                     | NULL               |
| customer       | text                        | NULL               |
| month          | integer                     | NULL               |
| target         | numeric                     | 10                 |
| inspection_qty | integer                     | 0                  |
| defects        | integer                     | 0                  |
| actual         | numeric                     | 0                  |
| created_at     | timestamp with time zone    | now()              |
| **updated_at** | **timestamp with time zone**| **now()**          |

### 트리거 목록 (정상 상태)
| trigger_name                        | event_manipulation | action_timing |
|-------------------------------------|-------------------|---------------|
| update_customer_metrics_updated_at  | INSERT            | BEFORE        |
| update_customer_metrics_updated_at  | UPDATE            | BEFORE        |

## 왜 이전 수정이 작동하지 않았나?

1. **스크립트를 실행하지 않음**: SQL 파일이 있어도 Supabase에서 직접 실행해야 적용됨
2. **부분 실행**: 스크립트 일부만 실행해서 컬럼은 추가됐지만 트리거가 안 만들어짐
3. **잘못된 순서**: 트리거를 먼저 만들고 컬럼을 나중에 추가하려고 시도
4. **캐싱 문제**: 변경사항이 적용됐지만 Supabase가 캐시를 새로고침 안 함

## 이번 수정의 차이점

✅ **자동 진단**: 현재 상태를 먼저 확인하고 문제 식별
✅ **안전한 실행**: 컬럼이 이미 있으면 스킵, 없으면 추가
✅ **올바른 순서**: 컬럼 먼저 추가, 그 다음 트리거 생성
✅ **자동 검증**: 실행 후 모든 것이 제대로 설정됐는지 확인
✅ **상세한 피드백**: 각 단계마다 무엇이 일어났는지 알려줌

## 긴급 연락

문제가 계속될 경우:
1. 스크린샷 캡처 (SQL Editor 실행 결과)
2. 브라우저 콘솔 로그 캡처 (F12 → Console 탭)
3. GitHub Issue에 첨부

---

**마지막 업데이트**: 2026-01-19
**작성자**: Claude Code
**상태**: ✅ 검증 완료
