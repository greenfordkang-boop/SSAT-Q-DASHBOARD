import React, { useState } from 'react';
import { getSchemaSQL, copySchemaToClipboard, getSupabaseSQLEditorURL } from '../lib/dbMigration';

interface DatabaseSetupScreenProps {
  supabaseUrl: string;
  onSetupComplete: () => void;
  onSkip: () => void;
}

const DatabaseSetupScreen: React.FC<DatabaseSetupScreenProps> = ({
  supabaseUrl,
  onSetupComplete,
  onSkip
}) => {
  const [copied, setCopied] = useState(false);
  const [showSQL, setShowSQL] = useState(false);
  const [sqlContent, setSqlContent] = useState('');

  const handleCopySQL = async () => {
    const success = await copySchemaToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      alert('클립보드 복사에 실패했습니다. SQL을 수동으로 복사해주세요.');
      await loadAndShowSQL();
    }
  };

  const loadAndShowSQL = async () => {
    const sql = await getSchemaSQL();
    setSqlContent(sql);
    setShowSQL(true);
  };

  const openSupabaseSQLEditor = () => {
    const url = getSupabaseSQLEditorURL(supabaseUrl);
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">데이터베이스 초기 설정</h1>
              <p className="text-blue-100 mt-1">Database Initialization Required</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Alert */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-semibold text-amber-800">필수 데이터베이스 테이블이 없습니다</p>
                <p className="text-sm text-amber-700 mt-1">
                  앱을 사용하기 전에 Supabase에서 데이터베이스 스키마를 실행해야 합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800">간단한 3단계 설정</h2>

            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">SQL 스크립트 복사</h3>
                <button
                  onClick={handleCopySQL}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      복사 완료!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      SQL 스크립트 복사하기
                    </>
                  )}
                </button>
                <button
                  onClick={loadAndShowSQL}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  SQL 내용 보기
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">Supabase SQL Editor 열기</h3>
                <button
                  onClick={openSupabaseSQLEditor}
                  className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Supabase SQL Editor 열기
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">SQL 붙여넣기 및 실행</h3>
                <p className="text-sm text-gray-600">
                  SQL Editor에서 <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+V</kbd> (또는 <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Cmd+V</kbd>)로 붙여넣고
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono ml-1">Run</kbd> 버튼을 클릭하세요.
                </p>
              </div>
            </div>
          </div>

          {/* SQL Preview */}
          {showSQL && sqlContent && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">SQL 스크립트 내용</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-64 text-sm font-mono">
                <pre>{sqlContent}</pre>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              onClick={onSetupComplete}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
            >
              ✓ 설정 완료, 다시 시도
            </button>
            <button
              onClick={onSkip}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              나중에 하기
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>도움말:</strong> 자세한 설정 방법은{' '}
              <a
                href="https://github.com/greenfordkang-boop/SSAT-Q-DASHBOARD/blob/main/SETUP.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline font-semibold"
              >
                SETUP.md
              </a>{' '}
              문서를 참고하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetupScreen;
