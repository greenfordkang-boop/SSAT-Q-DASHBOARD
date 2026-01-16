import React, { useState, useEffect, useRef } from 'react';
import { NCREntry, EightDData, NCRAttachment } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface EightDReportModalProps {
  entry: NCREntry;
  onSave: (id: string, updatedFields: Partial<NCREntry>) => void;
  onClose: () => void;
}

const EightDReportModal: React.FC<EightDReportModalProps> = ({ entry, onSave, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [report, setReport] = useState<EightDData>({
    docNo: `2025.${entry.month.toString().padStart(2, '0')}.${entry.id?.slice(0, 4).toUpperCase() || 'NEW'}`,
    lastUpdate: new Date().toISOString().split('T')[0],
    relatedPerson: { 
      actionDetail: '품질팀', 
      assemblyTeam: '생산팀', 
      developmentTeam: '기술팀' 
    },
    sevenW: {
      who: entry.customer,
      what: `${entry.model} / ${entry.partName}`,
      when: `2025.${entry.month.toString().padStart(2, '0')}.${entry.day.toString().padStart(2, '0')}`,
      where: entry.source,
      why: entry.defectContent,
      howMany: '1 EA',
      howOften: '1 Case'
    },
    containment: '',
    rootCause: {
      whyHappened: ['', '', '', '', ''],
      whyNotDetected: ['', '', '', '', ''],
    },
    countermeasures: [
      { type: 'Prevent', action: '', owner: '품질팀', complete: '', implement: '', status: 'Plan' },
      { type: 'Detection', action: '', owner: '생산팀', complete: '', implement: '', status: 'Plan' }
    ],
    verification: [
      { item: '개선 전후 데이터 비교 검증', yes: false, no: false, date: '' },
      { item: '신뢰성 시험 및 초품 검사', yes: false, no: false, date: '' }
    ],
    prevention: [
      { standard: 'CP', owner: '', complete: '', readAcross: 'N/A', raOwner: '', raComplete: '' },
      { standard: 'PFMEA', owner: '', complete: '', readAcross: 'N/A', raOwner: '', raComplete: '' }
    ],
    reviewAndConfirm: '',
    approvals: { 
      madeBy: '', 
      reviewBy: '', 
      approveBy: '', 
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.') 
    }
  });

  useEffect(() => {
    if (entry.eightDData) {
      setReport(entry.eightDData);
    }
  }, [entry]);

  const generateAIDraft = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert('VITE_GEMINI_API_KEY 설정이 필요합니다.');
      return;
    }
    setIsGenerating(true);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const prompt = `품질 관리 전문가로서 다음 NCR에 대한 8D 리포트 초안을 JSON 형식으로 작성하십시오.
      고객: ${entry.customer}, 품명: ${entry.partName}, 불량: ${entry.defectContent}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const aiResult = JSON.parse(text.replace(/```json|```/g, ''));

      setReport(prev => ({
        ...prev,
        sevenW: { ...prev.sevenW, ...aiResult.sevenW },
        containment: aiResult.containment || '',
        rootCause: {
          whyHappened: (aiResult.rootCause?.whyHappened || []).concat(['','','','','']).slice(0, 5),
          whyNotDetected: (aiResult.rootCause?.whyNotDetected || []).concat(['','','','','']).slice(0, 5),
        },
        countermeasures: prev.countermeasures.map((cm) => ({
          ...cm,
          action: aiResult.countermeasures?.find((a:any) => a.type === cm.type)?.action || cm.action,
          complete: new Date().toISOString().split('T')[0]
        })),
        reviewAndConfirm: aiResult.reviewAndConfirm || ''
      }));
    } catch (error) {
      console.error(error);
      alert('AI 생성 실패');
    } finally { setIsGenerating(false); }
  };

  const handleFinalSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      let pdfBase64 = '';
      if (reportRef.current) {
        const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, logging: false });
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
        pdfBase64 = pdf.output('datauristring').split(',')[1];
      }

      const newPdfAttachment: NCRAttachment = {
        name: `8D_AutoReport_${report.docNo}_${new Date().toLocaleDateString()}.pdf`,
        data: pdfBase64,
        type: 'application/pdf'
      };
      
      const updatedAttachments = [...(entry.attachments || []), newPdfAttachment];
      const summaryRootCause = report.rootCause.whyHappened.find(w => w.trim() !== '') || '8D 분석 완료';
      const summaryCountermeasure = report.countermeasures.map(c => c.action).filter(a => a.trim() !== '').join(' / ') || '8D 대책 수립';

      onSave(entry.id, {
        eightDData: report,
        rootCause: summaryRootCause,
        countermeasure: summaryCountermeasure,
        attachments: updatedAttachments,
        status: 'Closed',
        progressRate: 100
      });
      
      alert('저장 완료');
      onClose();
    } catch (e) {
      console.error(e);
      alert('저장 오류');
    } finally { setIsSaving(false); }
  };

  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const newReport = JSON.parse(JSON.stringify(report));
    let current: any = newReport;
    for (let i = 0; i < keys.length - 1; i++) { current = current[keys[i]]; }
    current[keys[keys.length - 1]] = value;
    setReport(newReport);
  };

  const standardTextStyle = "text-[9.5px] leading-[1.6] text-slate-800 w-full bg-transparent resize-none outline-none border-none focus:ring-0 p-0 whitespace-pre-wrap break-all";
  const sectionHeaderStyle = "bg-slate-200 p-0.5 px-2 text-[10.5px] font-bold border-b border-slate-800 text-slate-900";

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="flex-1 flex justify-center py-4 px-4">
        <div className="bg-white w-full max-w-[1050px] rounded shadow-2xl overflow-hidden border-2 border-slate-800 flex flex-col h-fit mb-8">
          <div className="bg-slate-900 px-4 py-3 flex justify-between items-center text-white sticky top-0 z-[10000]">
            <div className="flex items-center gap-3">
               <span className="bg-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">8D SYSTEM</span>
               <h2 className="text-sm font-bold">8D 대책 리포트 작성</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={generateAIDraft} disabled={isGenerating} className="px-4 py-1.5 bg-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all">
                {isGenerating ? 'AI 분석중...' : 'AI 대책 초안 생성'}
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div className="bg-slate-100 p-4 md:p-8 flex justify-center overflow-x-auto">
             <div ref={reportRef} className="bg-white p-0 flex flex-col shadow-2xl" style={{ width: '210mm', minHeight: '297mm', border: '1px solid #000' }}>
                <div className="grid grid-cols-12 border-b-2 border-slate-800">
                  <div className="col-span-3 p-2 border-r-2 border-slate-800 flex flex-col justify-center bg-white text-[9px]">
                    <div className="font-bold">Doc No : {report.docNo}</div>
                    <div className="font-bold">Updated : {report.lastUpdate}</div>
                  </div>
                  <div className="col-span-5 p-1 border-r-2 border-slate-800 flex items-center justify-center">
                    <h1 className="text-2xl font-black tracking-[0.2em] text-slate-900 uppercase">8D REPORT</h1>
                  </div>
                  <div className="col-span-4 p-1.5 bg-slate-50 flex flex-col gap-0.5">
                    <div className="grid grid-cols-12 gap-0.5 font-bold text-[9px]">
                      <div className="col-span-1 border border-slate-800 text-center bg-white font-black">S</div>
                      <div className="col-span-11 pl-1">1. Related Person</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 flex-1 border-b-2 border-slate-800">
                  <div className="col-span-4 border-r-2 border-slate-800 flex flex-col">
                    <div className={sectionHeaderStyle}>2. Problem Definition</div>
                    <div className="divide-y divide-slate-800 border-b border-slate-800">
                      {Object.entries(report.sevenW).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-12 min-h-[28px]">
                          <div className="col-span-3 p-1 bg-white border-r border-slate-300 font-bold capitalize flex items-center text-[9px]">{key}</div>
                          <div className="col-span-9 p-1"><textarea className={standardTextStyle} rows={1} value={value} onChange={e => updateField(`sevenW.${key}`, e.target.value)} /></div>
                        </div>
                      ))}
                    </div>

                    <div className={sectionHeaderStyle}>3. Containment Actions</div>
                    <div className="p-1.5 flex-1 min-h-[100px] border-b border-slate-800">
                      <textarea className={standardTextStyle} style={{height: '100%'}} value={report.containment} onChange={e => updateField('containment', e.target.value)} />
                    </div>

                    <div className={sectionHeaderStyle}>4. Root Cause Analysis (5-Why)</div>
                    <div className="p-1.5 space-y-4 flex-1 bg-white">
                      <div>
                        <div className="font-bold mb-1.5 text-blue-900 text-[9px] border-b border-blue-100">Occurrence Cause</div>
                        {report.rootCause.whyHappened.map((why, i) => (
                          <div key={i} className="flex gap-1 items-start min-h-[20px]">
                            {/* 핵심 수정 부분: > 를 &gt; 로 변경 */}
                            <span className="w-11 text-blue-700 text-[8.5px] font-bold">{i+1} Why &gt;</span>
                            <textarea className="flex-1 border-b border-slate-100 text-[9px] outline-none py-0.5 bg-transparent resize-none overflow-hidden" rows={1} value={why} onChange={e => {
                              const wh = [...report.rootCause.whyHappened]; wh[i] = e.target.value; updateField('rootCause.whyHappened', wh);
                            }} />
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="font-bold mb-1.5 text-rose-900 text-[9px] border-b border-rose-100">Detection Cause</div>
                        {report.rootCause.whyNotDetected.map((why, i) => (
                          <div key={i} className="flex gap-1 items-start min-h-[20px]">
                            {/* 핵심 수정 부분: > 를 &gt; 로 변경 */}
                            <span className="w-11 text-rose-700 text-[8.5px] font-bold">{i+1} Why &gt;</span>
                            <textarea className="flex-1 border-b border-slate-100 text-[9px] outline-none py-0.5 bg-transparent resize-none overflow-hidden" rows={1} value={why} onChange={e => {
                              const wd = [...report.rootCause.whyNotDetected]; wd[i] = e.target.value; updateField('rootCause.whyNotDetected', wd);
                            }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-8 flex flex-col">
                    <div className={sectionHeaderStyle}>5. Permanent Corrective Actions</div>
                    <div className="flex-1 p-2">
                       <p className="text-[10px] text-slate-500">대책 내용을 입력하세요...</p>
                    </div>
                  </div>
                </div>
             </div>
          </div>

          <div className="p-4 bg-slate-100 flex justify-end gap-3 border-t-2 border-slate-800">
            <button onClick={onClose} className="px-6 py-2 border border-slate-300 rounded text-xs font-bold hover:bg-white">취소</button>
            <button onClick={handleFinalSave} disabled={isSaving} className="px-12 py-2.5 bg-blue-600 text-white rounded font-black hover:bg-blue-700 shadow-md text-xs">
              {isSaving ? '전산 등록 중...' : '최종 저장 및 전산 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EightDReportModal;
