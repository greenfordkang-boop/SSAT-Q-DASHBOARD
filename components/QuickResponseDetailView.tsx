
import React, { useEffect } from 'react';
import { QuickResponseEntry, ResponseStatus } from '../types';

interface QuickResponseDetailViewProps {
  entry: QuickResponseEntry;
  onClose: () => void;
  onEdit: (entry: QuickResponseEntry) => void;
  onDelete: (id: string) => void;
}

const QuickResponseDetailView: React.FC<QuickResponseDetailViewProps> = ({ entry, onClose, onEdit, onDelete }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getStatusBadge = (status: ResponseStatus, label: string) => {
    const styles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
      'G': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
      'R': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
      'Y': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
      'N/A': { bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-200', dot: 'bg-slate-300' },
    };
    const s = styles[status] || styles['N/A'];
    const statusLabel: Record<string, string> = { 'G': '완료', 'R': '지연', 'Y': '진행중', 'N/A': '해당없음' };
    return (
      <div className={`${s.bg} ${s.border} border rounded-2xl p-4 flex flex-col items-center gap-2`}>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight text-center">{label}</span>
        <div className={`w-10 h-10 ${s.dot} rounded-full flex items-center justify-center`}>
          <span className="text-white text-sm font-black">{status}</span>
        </div>
        <span className={`text-xs font-bold ${s.text}`}>{statusLabel[status] || status}</span>
      </div>
    );
  };

  const overallStatus = () => {
    const statuses = [entry.status24H, entry.status3D, entry.status14DAY, entry.status24D, entry.status25D, entry.status30D];
    const hasR = statuses.includes('R');
    const hasY = statuses.includes('Y');
    const allG = statuses.every(s => s === 'G' || s === 'N/A');
    if (hasR) return { label: '지연 발생', color: 'text-rose-600', bg: 'bg-rose-100' };
    if (hasY) return { label: '진행 중', color: 'text-amber-700', bg: 'bg-amber-100' };
    if (allG) return { label: '전체 완료', color: 'text-emerald-700', bg: 'bg-emerald-100' };
    return { label: '대기', color: 'text-slate-600', bg: 'bg-slate-100' };
  };

  const completionRate = () => {
    const statuses = [entry.status24H, entry.status3D, entry.status14DAY, entry.status24D, entry.status25D, entry.status30D];
    const applicable = statuses.filter(s => s !== 'N/A');
    if (applicable.length === 0) return 100;
    const completed = applicable.filter(s => s === 'G').length;
    return Math.round((completed / applicable.length) * 100);
  };

  const rate = completionRate();
  const status = overallStatus();

  const getProgressColor = (r: number) => {
    if (r >= 100) return 'bg-emerald-500';
    if (r >= 60) return 'bg-blue-500';
    if (r >= 30) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      if (entry.id) {
        onDelete(entry.id);
        onClose();
      }
    }
  };

  // 데이터가 있는 추가 필드만 수집
  const extraFields: { label: string; value: string }[] = [];
  if (entry.defectType) extraFields.push({ label: '불량유형', value: entry.defectType });
  if (entry.process) extraFields.push({ label: '공정', value: entry.process });
  if (entry.coating) extraFields.push({ label: '도장', value: entry.coating });
  if (entry.area) extraFields.push({ label: '면적', value: entry.area });
  if (entry.materialCode) extraFields.push({ label: '재질코드', value: entry.materialCode });
  if (entry.shielding) extraFields.push({ label: '차폐', value: entry.shielding });
  if (entry.meetingAttendance) extraFields.push({ label: '회의참석', value: entry.meetingAttendance });
  if (entry.customerMM) extraFields.push({ label: '고객 MM', value: entry.customerMM });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-1.5 h-8 bg-blue-600 rounded-full shrink-0"></div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-black text-slate-800 truncate">{entry.model || '미지정'}</h2>
                <span className="text-sm text-slate-500 font-medium">{entry.department}</span>
                <span className="text-xs text-slate-400">{entry.date}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-black ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] text-slate-400 font-bold">완료율 {rate}%</span>
                <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${getProgressColor(rate)}`} style={{ width: `${Math.min(rate, 100)}%` }}></div>
                </div>
                {entry.defectCount > 0 && (
                  <span className="text-[10px] text-rose-500 font-black">불량 {entry.defectCount}건</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* 기본 정보 */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">기본 정보</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400 font-bold">발생일자</dt>
                <dd className="text-sm font-bold text-slate-700">{entry.date}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400 font-bold">발생장소</dt>
                <dd className="text-sm font-bold text-slate-700">{entry.department}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400 font-bold">호기번호</dt>
                <dd className="text-sm text-slate-700">{entry.machineNo || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400 font-bold">차종/품명</dt>
                <dd className="text-sm font-bold text-slate-700">{entry.model || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400 font-bold">불량수</dt>
                <dd className="text-sm font-bold text-rose-600">{entry.defectCount}건</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400 font-bold">담당자</dt>
                <dd className="text-sm font-bold text-slate-700">{entry.materialManager || '-'}</dd>
              </div>
              {extraFields.map((f, i) => (
                <div key={i} className="flex justify-between">
                  <dt className="text-xs text-slate-400 font-bold">{f.label}</dt>
                  <dd className="text-sm text-slate-700">{f.value}</dd>
                </div>
              ))}
            </div>
          </div>

          {/* 현상/문제점 */}
          {entry.defectContent && (
            <div className="bg-blue-50/60 rounded-2xl p-5 border border-blue-100/60">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider mb-3">현상 / 문제점</h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {entry.defectContent}
              </p>
            </div>
          )}

          {/* 대응 단계별 상태 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-5">단계별 대응 현황</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {getStatusBadge(entry.status24H as ResponseStatus, '봉쇄조치 (24HR)')}
              {getStatusBadge(entry.status3D as ResponseStatus, '원인분석 (3D)')}
              {getStatusBadge(entry.status14DAY as ResponseStatus, '시정조치 (14D)')}
              {getStatusBadge(entry.status24D as ResponseStatus, '검출/감사 (24D)')}
              {getStatusBadge(entry.status25D as ResponseStatus, 'PFMEA/교육 (25D)')}
              {getStatusBadge(entry.status30D as ResponseStatus, '습득교훈 (30D)')}
            </div>

            {/* 타임라인 진행 바 */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1">
                {[
                  { status: entry.status24H, label: '24H' },
                  { status: entry.status3D, label: '3D' },
                  { status: entry.status14DAY, label: '14D' },
                  { status: entry.status24D, label: '24D' },
                  { status: entry.status25D, label: '25D' },
                  { status: entry.status30D, label: '30D' },
                ].map((step, i) => {
                  const colors: Record<string, string> = {
                    'G': 'bg-emerald-500',
                    'R': 'bg-rose-500',
                    'Y': 'bg-amber-400',
                    'N/A': 'bg-slate-200',
                  };
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full h-2 rounded-full ${colors[step.status] || 'bg-slate-200'}`}></div>
                      <span className="text-[9px] text-slate-400 font-bold">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 조치사항 / 개선대책 */}
          {(entry.action || entry.remarks) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {entry.action && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">조치사항</h3>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.action}</p>
                </div>
              )}
              {entry.remarks && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">개선대책 / 비고</h3>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.remarks}</p>
                </div>
              )}
            </div>
          )}

          {/* 데이터 없을 때 안내 */}
          {!entry.defectContent && !entry.action && !entry.remarks && (
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 text-center">
              <p className="text-sm text-slate-400">상세 내용이 등록되지 않았습니다. 편집 버튼으로 내용을 추가하세요.</p>
            </div>
          )}
        </div>

        {/* 하단 액션 */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { onEdit(entry); onClose(); }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              편집
            </button>
            <button
              onClick={handleDelete}
              className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-black shadow-lg hover:bg-rose-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              삭제
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-8 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-500 text-sm hover:bg-slate-100 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickResponseDetailView;
