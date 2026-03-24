
import React, { useEffect } from 'react';
import { NCREntry, NCRStatus, NCRAttachment } from '../types';

interface NCRDetailViewProps {
  entry: NCREntry;
  onClose: () => void;
  onEdit: (entry: NCREntry) => void;
  onOpen8D: (entry: NCREntry) => void;
  onDelete: (id: string) => void;
}

const NCRDetailView: React.FC<NCRDetailViewProps> = ({ entry, onClose, onEdit, onOpen8D, onDelete }) => {
  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getStatusBadge = (status: NCRStatus) => {
    switch (status) {
      case 'Closed': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black">완료</span>;
      case 'Delay': return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-black">지연</span>;
      default: return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-black">진행</span>;
    }
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 100) return 'bg-emerald-500';
    if (rate >= 60) return 'bg-blue-500';
    if (rate >= 30) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const b64toBlob = (b64Data: string, contentType: string = '', sliceSize: number = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) { byteNumbers[i] = slice.charCodeAt(i); }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  const openAttachment = (file: NCRAttachment) => {
    try {
      const blob = b64toBlob(file.data, file.type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      alert('파일 열기 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류'));
    }
  };

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      onDelete(entry.id);
      onClose();
    }
  };

  const ed = entry.eightDData;

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
                <h2 className="text-lg font-black text-slate-800 truncate">{entry.customer}</h2>
                <span className="text-sm text-slate-500 font-medium">{entry.model}</span>
                <span className="text-xs text-slate-400">{entry.source}</span>
                <span className="text-xs text-slate-400">{entry.month}/{entry.day}</span>
                {getStatusBadge(entry.status)}
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] text-slate-400 font-bold">진척률 {entry.progressRate}%</span>
                <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${getProgressColor(entry.progressRate)}`} style={{ width: `${Math.min(entry.progressRate, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 기본정보 + 원인/대책 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 기본 정보 카드 */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">기본 정보</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-xs text-slate-400 font-bold">발생일자</dt>
                  <dd className="text-sm font-bold text-slate-700">{entry.month}월 {entry.day}일</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-xs text-slate-400 font-bold">고객사</dt>
                  <dd className="text-sm font-bold text-slate-700">{entry.customer}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-xs text-slate-400 font-bold">모델</dt>
                  <dd className="text-sm text-slate-700">{entry.model || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-xs text-slate-400 font-bold">품명</dt>
                  <dd className="text-sm text-slate-700">{entry.partName || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-xs text-slate-400 font-bold">품번</dt>
                  <dd className="text-sm text-slate-700">{entry.partNo || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-xs text-slate-400 font-bold">Source</dt>
                  <dd className="text-sm text-slate-700">{entry.source || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-xs text-slate-400 font-bold">계획일</dt>
                  <dd className="text-sm text-slate-700">{entry.planDate || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-xs text-slate-400 font-bold">완료일</dt>
                  <dd className="text-sm text-slate-700">{entry.resultDate || '-'}</dd>
                </div>
              </dl>
            </div>

            {/* 원인 및 대책 카드 */}
            <div className="space-y-4">
              <div className="bg-blue-50/70 rounded-2xl p-5 border border-blue-100/60">
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider mb-2">원인</h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.rootCause || '분석 중'}</p>
              </div>
              <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-100/60">
                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-2">대책</h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.countermeasure || '수립 중'}</p>
              </div>
              <div className="bg-purple-50/70 rounded-2xl p-5 border border-purple-100/60">
                <h3 className="text-xs font-black text-purple-600 uppercase tracking-wider mb-2">유효성 점검</h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.validationCheck || '-'}</p>
              </div>
            </div>
          </div>

          {/* 불량내용 + 첨부파일 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 불량 내용 */}
            <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100/60">
              <h3 className="text-xs font-black text-amber-600 uppercase tracking-wider mb-2">불량 내용</h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.defectContent || '-'}</p>
              {entry.remarks && (
                <div className="mt-3 pt-3 border-t border-amber-200/60">
                  <h4 className="text-[10px] font-black text-amber-500 uppercase mb-1">비고</h4>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap">{entry.remarks}</p>
                </div>
              )}
            </div>

            {/* 첨부 파일 */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">첨부 파일</h3>
              {entry.attachments && entry.attachments.length > 0 ? (
                <div className="space-y-2">
                  {entry.attachments.map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => openAttachment(file)}
                      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      </div>
                      <span className="text-sm font-medium text-slate-700 truncate flex-1">{file.name}</span>
                      <span className="text-[10px] text-blue-600 font-bold shrink-0">열기</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">첨부 파일 없음</p>
              )}
            </div>
          </div>

          {/* 8D 보고서 요약 (eightDData 있을 때만) */}
          {ed && (
            <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-wider">8D 보고서 요약</h3>
                <span className="text-[10px] text-indigo-400 font-bold">{ed.docNo} | {ed.lastUpdate}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 7W 분석 */}
                <div className="bg-white/80 rounded-xl p-4 border border-indigo-100/40">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase mb-2">7W 분석</h4>
                  <dl className="space-y-1.5 text-xs">
                    {ed.sevenW.who && <div><span className="text-indigo-400 font-bold">Who:</span> <span className="text-slate-600">{ed.sevenW.who}</span></div>}
                    {ed.sevenW.what && <div><span className="text-indigo-400 font-bold">What:</span> <span className="text-slate-600">{ed.sevenW.what}</span></div>}
                    {ed.sevenW.when && <div><span className="text-indigo-400 font-bold">When:</span> <span className="text-slate-600">{ed.sevenW.when}</span></div>}
                    {ed.sevenW.where && <div><span className="text-indigo-400 font-bold">Where:</span> <span className="text-slate-600">{ed.sevenW.where}</span></div>}
                    {ed.sevenW.why && <div><span className="text-indigo-400 font-bold">Why:</span> <span className="text-slate-600">{ed.sevenW.why}</span></div>}
                    {ed.sevenW.howMany && <div><span className="text-indigo-400 font-bold">How Many:</span> <span className="text-slate-600">{ed.sevenW.howMany}</span></div>}
                    {ed.sevenW.howOften && <div><span className="text-indigo-400 font-bold">How Often:</span> <span className="text-slate-600">{ed.sevenW.howOften}</span></div>}
                  </dl>
                </div>

                {/* 근본 원인 5-Why */}
                <div className="bg-white/80 rounded-xl p-4 border border-indigo-100/40">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase mb-2">근본 원인 (5-Why)</h4>
                  {ed.rootCause.whyHappened.some(w => w) && (
                    <div className="mb-2">
                      <span className="text-[10px] text-rose-500 font-bold">발생 원인:</span>
                      <ol className="list-decimal list-inside text-xs text-slate-600 mt-1 space-y-0.5">
                        {ed.rootCause.whyHappened.filter(w => w).map((w, i) => <li key={i}>{w}</li>)}
                      </ol>
                    </div>
                  )}
                  {ed.rootCause.whyNotDetected.some(w => w) && (
                    <div>
                      <span className="text-[10px] text-amber-500 font-bold">유출 원인:</span>
                      <ol className="list-decimal list-inside text-xs text-slate-600 mt-1 space-y-0.5">
                        {ed.rootCause.whyNotDetected.filter(w => w).map((w, i) => <li key={i}>{w}</li>)}
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              {/* 대책 요약 */}
              {ed.countermeasures.some(cm => cm.action) && (
                <div className="mt-4 bg-white/80 rounded-xl p-4 border border-indigo-100/40">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase mb-2">대책</h4>
                  <div className="space-y-1.5">
                    {ed.countermeasures.filter(cm => cm.action).map((cm, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${cm.type === 'Prevent' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{cm.type}</span>
                        <span className="text-slate-600 flex-1">{cm.action}</span>
                        <span className="text-slate-400 shrink-0">{cm.owner}</span>
                        <span className={`text-[9px] font-bold shrink-0 ${cm.status === '완료' ? 'text-emerald-600' : 'text-slate-400'}`}>{cm.status || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 승인 정보 */}
              {ed.approvals && (ed.approvals.madeBy || ed.approvals.reviewBy || ed.approvals.approveBy) && (
                <div className="mt-4 flex items-center gap-6 text-xs text-slate-500">
                  {ed.approvals.madeBy && <span>작성: <strong className="text-slate-700">{ed.approvals.madeBy}</strong></span>}
                  {ed.approvals.reviewBy && <span>검토: <strong className="text-slate-700">{ed.approvals.reviewBy}</strong></span>}
                  {ed.approvals.approveBy && <span>승인: <strong className="text-slate-700">{ed.approvals.approveBy}</strong></span>}
                  {ed.approvals.date && <span className="text-slate-400">{ed.approvals.date}</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 액션 */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { onEdit(entry); }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              편집
            </button>
            <button
              onClick={() => { onOpen8D(entry); }}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              8D Report
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

export default NCRDetailView;
