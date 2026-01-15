
import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { SupplierMetric } from '../types';
import { SUPPLIER_LIST } from '../data/mockData';

interface IncomingQualityProps {
  metrics: SupplierMetric[];
  onSaveMetric: (payload: SupplierMetric | SupplierMetric[]) => Promise<boolean>;
}

const IncomingQuality: React.FC<IncomingQualityProps> = ({ metrics, onSaveMetric }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [annualTarget, setAnnualTarget] = useState(7500);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [isSaving, setIsSaving] = useState(false);

  // 실적 입력을 위한 상태
  const [entryForm, setEntryForm] = useState<SupplierMetric>({
    year: new Date().getFullYear(),
    supplier: '신소재산업',
    month: new Date().getMonth() + 1,
    target: 7500,
    incomingQty: 0,
    inspectionQty: 0,
    defects: 0,
    actual: 0
  });

  // 검사수량/불량수량 변경 시 PPM 실시간 계산
  useEffect(() => {
    const qty = Number(entryForm.inspectionQty);
    const def = Number(entryForm.defects);
    if (qty > 0) {
      const calculatedPpm = Math.round((def / qty) * 1000000);
      setEntryForm(prev => ({ ...prev, actual: calculatedPpm }));
    } else {
      setEntryForm(prev => ({ ...prev, actual: 0 }));
    }
  }, [entryForm.inspectionQty, entryForm.defects]);

  // 선택된 월의 업체별 데이터
  const monthlyData = useMemo(() => {
    return SUPPLIER_LIST.map(supplier => {
      const found = metrics.find(item =>
        item.supplier === supplier &&
        Number(item.year) === selectedYear &&
        Number(item.month) === selectedMonth
      );

      return {
        name: supplier,
        incoming: found ? Number(found.incomingQty) : 0,
        inspection: found ? Number(found.inspectionQty) : 0,
        defect: found ? Number(found.defects) : 0,
        ppm: found && found.inspectionQty > 0 ? Number(found.actual) : 0,
        target: found ? Number(found.target) : 7500
      };
    });
  }, [metrics, selectedYear, selectedMonth]);

  // 월별 합계
  const monthlySummary = useMemo(() => {
    const sumIncoming = monthlyData.reduce((a, b) => a + b.incoming, 0);
    const sumInspection = monthlyData.reduce((a, b) => a + b.inspection, 0);
    const sumDefects = monthlyData.reduce((a, b) => a + b.defect, 0);
    const avgPpm = sumInspection > 0 ? Math.round((sumDefects / sumInspection) * 1000000) : 0;
    const targetAchieved = monthlyData.filter(d => d.ppm <= d.target && d.inspection > 0).length;

    return { sumIncoming, sumInspection, sumDefects, avgPpm, targetAchieved };
  }, [monthlyData]);

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entryForm.inspectionQty < 0 || entryForm.defects < 0 || entryForm.incomingQty < 0) {
      alert("수량과 불량수는 0 이상이어야 합니다.");
      return;
    }

    setIsSaving(true);
    const success = await onSaveMetric(entryForm);
    setIsSaving(false);

    if (success) {
        setShowEntryModal(false);
        alert('협력업체 실적이 저장되었습니다.');
    }
  };

  const handleAnnualTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (window.confirm(`${targetYear}년 모든 협력업체의 모든 달 목표를 ${annualTarget} PPM으로 변경하시겠습니까?`)) {
      setIsSaving(true);
      const batchPayload: SupplierMetric[] = [];

      SUPPLIER_LIST.forEach(supplier => {
        Array.from({ length: 12 }, (_, i) => {
          const m = i + 1;
          const existing = metrics.find(item =>
            item.supplier === supplier &&
            Number(item.year) === targetYear &&
            Number(item.month) === m
          );
          batchPayload.push({
            year: targetYear,
            supplier: supplier,
            month: m,
            target: annualTarget,
            incomingQty: existing?.incomingQty || 0,
            inspectionQty: existing?.inspectionQty || 0,
            defects: existing?.defects || 0,
            actual: existing?.actual || 0
          });
        });
      });

      const success = await onSaveMetric(batchPayload);
      setIsSaving(false);

      if (success) {
        setShowTargetModal(false);
        alert(`${targetYear}년 목표가 전산에 일괄 등록되었습니다.`);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 상단 컨트롤 바 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-6">
           <div className="flex flex-col">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">분석 연도</label>
             <select
               value={selectedYear}
               onChange={(e) => setSelectedYear(Number(e.target.value))}
               className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-500"
             >
               {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
             </select>
           </div>
           <div className="flex flex-col">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">분석 월</label>
             <select
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(Number(e.target.value))}
               className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-500"
             >
               {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}월</option>)}
             </select>
           </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => {
                setTargetYear(selectedYear);
                setShowTargetModal(true);
            }}
            className="flex-1 md:flex-none bg-slate-800 hover:bg-black text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            연간 목표 설정
          </button>
          <button
            onClick={() => {
              const curData = monthlyData.find(d => d.name === entryForm.supplier);
              setEntryForm({
                year: selectedYear,
                supplier: '신소재산업',
                month: selectedMonth,
                target: curData?.target || 7500,
                incomingQty: curData?.incoming || 0,
                inspectionQty: curData?.inspection || 0,
                defects: curData?.defect || 0,
                actual: curData?.ppm || 0
              });
              setShowEntryModal(true);
            }}
            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            실적 입력/등록
          </button>
        </div>
      </div>

      {/* 차트 및 요약 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex justify-between">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
              업체별 PPM 실적 현황
            </span>
            <span className="text-blue-600 text-[10px]">목표: {annualTarget.toLocaleString()} ppm</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="ppm" radius={[4,4,0,0]} barSize={40}>
                  {monthlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.ppm > entry.target ? '#f43f5e' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <span className="text-[10px] font-bold text-slate-400">{selectedMonth}월 입고 총계</span>
               <p className="text-2xl font-black text-slate-800">{monthlySummary.sumIncoming.toLocaleString()} EA</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
               <span className="text-[10px] font-bold text-rose-400">{selectedMonth}월 불량 총계</span>
               <p className="text-2xl font-black text-rose-600">{monthlySummary.sumDefects.toLocaleString()} EA</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
               <span className="text-[10px] font-bold text-blue-400">{selectedMonth}월 평균 PPM</span>
               <p className="text-2xl font-black text-blue-600">{monthlySummary.avgPpm.toLocaleString()} PPM</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
               <span className="text-[10px] font-bold text-emerald-400">목표 달성업체</span>
               <p className="text-2xl font-black text-emerald-600">{monthlySummary.targetAchieved} / {SUPPLIER_LIST.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 상세 테이블 */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="font-black text-sm text-slate-800 uppercase tracking-tight">협력업체별 품질 지표 ({selectedYear}년 {selectedMonth}월 기준)</span>
          <span className="text-emerald-500 font-black text-[10px] px-2 py-1 bg-emerald-50 rounded uppercase tracking-widest">Connected</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 font-black">
              <tr>
                <th className="px-4 py-3 border-r">업체명</th>
                <th className="px-4 py-3 border-r text-center">입고수량</th>
                <th className="px-4 py-3 border-r text-center">검사수량</th>
                <th className="px-4 py-3 border-r text-center text-rose-600">불량수</th>
                <th className="px-4 py-3 border-r text-center bg-slate-200">PPM</th>
                <th className="px-4 py-3 text-center">목표 대비</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyData.map(item => (
                <tr key={item.name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 border-r font-bold">{item.name}</td>
                  <td className="px-4 py-3 border-r text-center">{item.incoming > 0 ? item.incoming.toLocaleString() : '-'}</td>
                  <td className="px-4 py-3 border-r text-center">{item.inspection > 0 ? item.inspection.toLocaleString() : '-'}</td>
                  <td className="px-4 py-3 border-r text-center font-bold text-rose-500">{item.defect > 0 ? item.defect : '-'}</td>
                  <td className={`px-4 py-3 border-r text-center font-black bg-slate-50 ${item.ppm > item.target ? 'text-rose-600' : 'text-blue-600'}`}>
                    {item.inspection > 0 ? item.ppm.toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.inspection > 0 ? (
                      item.ppm > item.target ? (
                        <span className="text-rose-500 font-bold">▲ 초과</span>
                      ) : (
                        <span className="text-blue-500 font-bold">✓ 달성</span>
                      )
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 연간 목표 설정 모달 */}
      {showTargetModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
               <h3 className="font-black">연간 목표 일괄 전산 등록</h3>
               <button onClick={() => setShowTargetModal(false)} className="text-slate-400 hover:text-white transition-colors">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <form onSubmit={handleAnnualTargetSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">설정 대상 연도</label>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold"
                  >
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">대상: 모든 협력업체</label>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">목표 PPM</label>
                  <input
                    type="number"
                    value={annualTarget}
                    onChange={(e) => setAnnualTarget(Number(e.target.value))}
                    className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl font-black text-2xl text-center text-emerald-600 focus:border-emerald-500 outline-none"
                    autoFocus
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? '전산 통신 중...' : '연간 목표 전산 확정'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 개별 실적 입력 모달 */}
      {showEntryModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
               <h3 className="font-black">{entryForm.year}년 {entryForm.month}월 실적 전산 등록</h3>
               <button onClick={() => setShowEntryModal(false)} className="text-slate-400 hover:text-white transition-colors">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <form onSubmit={handleEntrySubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">대상 협력업체</label>
                  <select
                    value={entryForm.supplier}
                    onChange={(e) => {
                      const supplier = e.target.value;
                      const existing = metrics.find(item =>
                        item.supplier === supplier &&
                        Number(item.year) === selectedYear &&
                        Number(item.month) === selectedMonth
                      );
                      setEntryForm({
                        ...entryForm,
                        supplier: supplier,
                        target: existing?.target || 7500,
                        incomingQty: existing?.incomingQty || 0,
                        inspectionQty: existing?.inspectionQty || 0,
                        defects: existing?.defects || 0,
                        actual: existing?.actual || 0
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold"
                  >
                    {SUPPLIER_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">발생 월</label>
                  <select
                    value={entryForm.month}
                    onChange={(e) => {
                      const m = parseInt(e.target.value);
                      const existing = metrics.find(item =>
                        item.supplier === entryForm.supplier &&
                        Number(item.year) === selectedYear &&
                        Number(item.month) === m
                      );
                      setEntryForm({
                        ...entryForm,
                        month: m,
                        target: existing?.target || 7500,
                        incomingQty: existing?.incomingQty || 0,
                        inspectionQty: existing?.inspectionQty || 0,
                        defects: existing?.defects || 0,
                        actual: existing?.actual || 0
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold"
                  >
                    {Array.from({length:12}, (_,i)=>i+1).map(m => <option key={m} value={m}>{m}월</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">해당 월 목표 (PPM)</label>
                <input
                  type="number"
                  value={entryForm.target}
                  onChange={(e) => setEntryForm({...entryForm, target: Number(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-emerald-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">입고 수량 (EA)</label>
                  <input
                    type="number"
                    value={entryForm.incomingQty}
                    onChange={(e) => setEntryForm({...entryForm, incomingQty: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">검사 수량 (EA)</label>
                  <input
                    type="number"
                    value={entryForm.inspectionQty}
                    onChange={(e) => setEntryForm({...entryForm, inspectionQty: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">불량 수량 (EA)</label>
                  <input
                    type="number"
                    value={entryForm.defects}
                    onChange={(e) => setEntryForm({...entryForm, defects: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-rose-600"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Auto Calculator</span>
                  <span className="text-xs font-bold text-blue-700">산출 PPM</span>
                </div>
                <span className="text-2xl font-black text-blue-700">{entryForm.actual.toLocaleString()} PPM</span>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? '전산 저장 중...' : '전산 데이터 등록 확정'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomingQuality;
