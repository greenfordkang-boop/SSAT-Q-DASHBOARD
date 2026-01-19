/**
 * 데이터베이스 마이그레이션 유틸리티
 * Supabase 데이터베이스 테이블 존재 여부 확인 및 SQL 스크립트 제공
 */

import { SupabaseClient } from '@supabase/supabase-js';

// 필수 테이블 목록
export const REQUIRED_TABLES = [
  'ncr_entries',
  'customer_metrics',
  'supplier_metrics',
  'outgoing_metrics',
  'quick_response_entries',
  'process_quality_uploads',
  'process_quality_data'
] as const;

export type TableName = typeof REQUIRED_TABLES[number];

/**
 * 특정 테이블이 존재하는지 확인
 */
export async function checkTableExists(
  supabase: SupabaseClient,
  tableName: TableName
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);

    // 테이블이 존재하지 않으면 특정 에러 메시지가 반환됨
    if (error) {
      const errorMsg = error.message.toLowerCase();
      if (
        errorMsg.includes('does not exist') ||
        errorMsg.includes('schema cache') ||
        errorMsg.includes('relation')
      ) {
        return false;
      }
      // 다른 에러 (예: RLS)는 테이블이 존재하는 것으로 간주
      return true;
    }

    return true;
  } catch (err) {
    console.error(`Error checking table ${tableName}:`, err);
    return false;
  }
}

/**
 * 모든 필수 테이블 존재 여부 확인
 */
export async function checkAllTables(
  supabase: SupabaseClient
): Promise<{
  allExist: boolean;
  existingTables: TableName[];
  missingTables: TableName[];
}> {
  const results = await Promise.all(
    REQUIRED_TABLES.map(async (table) => ({
      table,
      exists: await checkTableExists(supabase, table)
    }))
  );

  const existingTables = results
    .filter(r => r.exists)
    .map(r => r.table);

  const missingTables = results
    .filter(r => !r.exists)
    .map(r => r.table);

  return {
    allExist: missingTables.length === 0,
    existingTables,
    missingTables
  };
}

/**
 * 데이터베이스 스키마 SQL 스크립트 가져오기
 */
export async function getSchemaSQL(): Promise<string> {
  try {
    const response = await fetch('/supabase-schema.sql');
    if (!response.ok) {
      throw new Error('Failed to load schema file');
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading schema:', error);
    // Fallback: 기본 스키마 반환
    return DEFAULT_SCHEMA_SQL;
  }
}

/**
 * SQL 스크립트를 클립보드에 복사
 */
export async function copySchemaToClipboard(): Promise<boolean> {
  try {
    const sql = await getSchemaSQL();
    await navigator.clipboard.writeText(sql);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Supabase SQL Editor URL 생성
 */
export function getSupabaseSQLEditorURL(projectUrl: string): string {
  try {
    // https://xxxxx.supabase.co → xxxxx 추출
    const url = new URL(projectUrl);
    const projectId = url.hostname.split('.')[0];
    return `https://supabase.com/dashboard/project/${projectId}/sql/new`;
  } catch (error) {
    return 'https://supabase.com/dashboard';
  }
}

// Fallback 스키마 (supabase-schema.sql 파일을 로드할 수 없을 때 사용)
const DEFAULT_SCHEMA_SQL = `-- ============================================
-- SSAT Q-Dashboard Supabase 테이블 생성 스크립트
-- ============================================

-- 7. Process Quality Upload History 테이블 (공정품질 업로드 이력)
CREATE TABLE IF NOT EXISTS process_quality_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pq_uploads_date ON process_quality_uploads(upload_date DESC);
ALTER TABLE process_quality_uploads DISABLE ROW LEVEL SECURITY;

-- 8. Process Quality Data 테이블 (공정품질 불량 데이터)
CREATE TABLE IF NOT EXISTS process_quality_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES process_quality_uploads(id) ON DELETE CASCADE,
  customer TEXT NOT NULL,
  part_type TEXT NOT NULL,
  vehicle_model TEXT,
  product_name TEXT,
  production_qty INTEGER NOT NULL DEFAULT 0,
  defect_qty INTEGER NOT NULL DEFAULT 0,
  defect_amount NUMERIC NOT NULL DEFAULT 0,
  defect_rate NUMERIC NOT NULL DEFAULT 0,
  data_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pq_data_upload ON process_quality_data(upload_id);
CREATE INDEX IF NOT EXISTS idx_pq_data_customer ON process_quality_data(customer);
CREATE INDEX IF NOT EXISTS idx_pq_data_part_type ON process_quality_data(part_type);
CREATE INDEX IF NOT EXISTS idx_pq_data_vehicle_model ON process_quality_data(vehicle_model);
CREATE INDEX IF NOT EXISTS idx_pq_data_product_name ON process_quality_data(product_name);
CREATE INDEX IF NOT EXISTS idx_pq_data_date ON process_quality_data(data_date DESC);
ALTER TABLE process_quality_data DISABLE ROW LEVEL SECURITY;

-- Updated_at 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pq_data_updated_at ON process_quality_data;
CREATE TRIGGER update_pq_data_updated_at
  BEFORE INSERT OR UPDATE ON process_quality_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;
