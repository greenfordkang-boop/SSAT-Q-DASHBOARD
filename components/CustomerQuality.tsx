
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { CustomerMetric } from '../types';
import { CUSTOMER_LIST } from '../data/mockData';

interface CustomerQualityProps {
  metrics: CustomerMetric[];
  onSaveMetric: (payload: CustomerMetric | CustomerMetric[]) => Promise<boolean>;
}

const CustomerQuality: React.FC<CustomerQualityProps> = ({ metrics, onSaveMetric }) => {
  const [selectedCustomer, setSelectedCustomer] = useState('LGE');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [annualTarget, setAnnualTarget] = useState(10);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [isSaving, setIsSaving] = useState(false);
  
  // 실적 입력을 위한 상태
  const [entryForm, setEntryForm] = useState<CustomerMetric>({
    year: new Date().getFullYear(),
    customer: 'LGE',
    month: new Date().getMonth() + 1,
    target: 10,
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

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const found = metrics.find(item => 
        item.customer === selectedCustomer && 
        Number(item.year) === selectedYear && 
        Number(item.month) === m
      );
      
      return {
        name: `${m}월`,
        target: found ? Number(found.target) : 10,
        actual: found && found.inspectionQty > 0 ? Number(found.actual) : null,
        defects: found ? Number(found.defects) : 0,
        inspectionQty: found ? Number(found.inspectionQty) : 0
      };
    });
  }, [metrics, selectedCustomer, selectedYear]);

  const yearSummary = useMemo(() => {
    const sumDefects = chartData.reduce((a, b) => a + b.defects, 0);
    const sumInspect = chartData.reduce((a, b) => a + b.inspectionQty, 0);
    const avgTarget = chartData.reduce((a, b) => a + b.target, 0) / 12;
    const totalAvgPpm = sumInspect > 0 ? Math.round((sumDefects / sumInspect) * 1000000) : 0;
    
    return { avgPpm: totalAvgPpm, sumDefects, sumInspect, avgTarget };
  }, [chartData]);

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entryForm.inspectionQty < 0 || entryForm.defects < 0) {
      alert("수량과 불량수는 0 이상이어야 합니다.");
      return;
    }
    
    setIsSaving(true);
    // 비동기 저장 호출
    const success = await onSaveMetric(entryForm);
    setIsSaving(false);

    if (success) {
        setShowEntryModal(false);
        alert('실적이 저장되었습니다.');
    }
  };

  const handleAnnualTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (window.confirm(`${targetYear}년 ${selectedCustomer}의 모든 달 목표를 ${annualTarget} PPM으로 변경하시겠습니까?`)) {
      setIsSaving(true);
      const batchPayload: CustomerMetric[] = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        // 기존 데이터 유지하면서 목표만 업데이트
        const existing = metrics.find(item => 
          item.customer === selectedCustomer && 
          Number(item.year) === targetYear && 
          Number(item.month) === m
        );
        return {
          year: targetYear,
          customer: selectedCustomer,
          month: m,
          target: annualTarget,
          inspectionQty: existing?.inspectionQty || 0,
          defects: existing?.defects || 0,
          actual: existing?.actual || 0
        };
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
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">분석 고객사</label>
             <select 
               value={selectedCustomer} 
               onChange={(e) => setSelectedCustomer(e.target.value)}
               className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-500"
             >
               {CUSTOMER_LIST.map(c => <option key={c} value={c}>{c}</option>)}
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
              const curMonth = new Date().getMonth() + 1;
              const curData = chartData.find(d => d.name === `${curMonth}월`);
              setEntryForm({
                year: selectedYear,
                customer: selectedCustomer,
                month: curMonth,
                target: curData?.target || 10,
                inspectionQty: curData?.inspectionQty || 0,
                defects: curData?.defects || 0,
                actual: curData?.actual || 0
              });
              setShowEntryModal(true);
            }}
            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            실적 입력/등록
          </button>
        </div>
      </div>

      {/* 실적 요약 및 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-1">
          <h3 className="text-xs font-black text-slate-400 mb-8 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div> {selectedYear}년 누계 실적 현황
          </h3>
          <div className="space-y-8">
            <div className="flex justify-between items-end border-b border-slate-100 pb-4">
               <span className="text-xs font-bold text-slate-500">연간 누계 PPM</span>
               <span className={`text-3xl font-black ${yearSummary.avgPpm > yearSummary.avgTarget ? 'text-rose-600' : 'text-blue-600'}`}>{yearSummary.avgPpm.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-end border-b border-slate-100 pb-4">
               <span className="text-xs font-bold text-slate-500">총 불량 수량</span>
               <span className="text-2xl font-black text-slate-800">{yearSummary.sumDefects.toLocaleString()} <span className="text-sm font-bold text-slate-400">EA</span></span>
            </div>
            <div className="flex justify-between items-end border-b border-slate-100 pb-4">
               <span className="text-xs font-bold text-slate-500">총 검사 수량</span>
               <span className="text-2xl font-black text-slate-800">{yearSummary.sumInspect.toLocaleString()} <span className="text-sm font-bold text-slate-400">EA</span></span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-black text-slate-800 mb-6 flex justify-between items-center">
            <span className="flex items-center gap-2"><div className="w-1.5 h-4 bg-blue-600 rounded-full"></div> {selectedYear}년 {selectedCustomer} PPM 추이</span>
            <span className="text-emerald-500 font-black text-[10px] px-2 py-1 bg-emerald-50 rounded uppercase tracking-widest">Connected</span>
          </h3>
          {/* 차트 렌더링 에러 방지를 위해 명시적 높이 지정 */}
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  itemStyle={{fontWeight: 800, fontSize: '12px'}}
                />
                <Legend iconType="circle" verticalAlign="top" align="right" height={36} />
                <Line type="stepAfter" dataKey="target" stroke="#10b981" strokeDasharray="5 5" strokeWidth={2} name="목표" dot={false} />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={4} dot={{r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} name="실적" connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 하단 상세 테이블 */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="font-black text-sm text-slate-800 uppercase tracking-tight">{selectedCustomer} {selectedYear}년 실적 전산 상세</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Batch Process Mode</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1300px]">
            <thead className="bg-slate-100 text-slate-600 uppercase font-black">
              <tr>
                <th className="px-4 py-5 border-r w-32">구분</th>
                {chartData.map(m => <th key={m.name} className="px-2 py-5 border-r text-center">{m.name}</th>)}
                <th className="px-4 py-5 text-center bg-slate-200 w-32 font-black">연간 누계</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4 border-r font-bold text-slate-400">목표(ppm)</td>
                {chartData.map((m, i) => <td key={i} className="px-2 py-4 border-r text-center font-bold text-slate-600">{m.target}</td>)}
                <td className="px-4 py-4 text-center font-black bg-slate-100">{yearSummary.avgTarget.toFixed(1)}</td>
              </tr>
              <tr className="hover:bg-blue-50/50 transition-colors group">
                <td className="px-4 py-4 border-r font-black text-blue-600 group-hover:bg-blue-100/30">실적(ppm)</td>
                {chartData.map((m, i) => (
                  <td key={i} className={`px-2 py-4 border-r text-center font-black ${m.actual === null ? 'text-slate-200' : (m.actual > m.target ? 'text-rose-500' : 'text-blue-600')}`}>
                    {m.actual !== null ? m.actual.toLocaleString() : '-'}
                  </td>
                ))}
                <td className={`px-4 py-4 text-center font-black bg-blue-100 ${yearSummary.avgPpm > yearSummary.avgTarget ? 'text-rose-600' : 'text-blue-700'}`}>
                  {yearSummary.avgPpm.toLocaleString()}
                </td>
              </tr>
              <tr className="hover:bg-rose-50/50 transition-colors group">
                <td className="px-4 py-4 border-r font-black text-rose-600 group-hover:bg-rose-100/30">불량수량 (EA)</td>
                {chartData.map((m, i) => <td key={i} className={`px-2 py-4 border-r text-center font-bold ${m.defects > 0 ? 'text-rose-500' : 'text-slate-300'}`}>{m.defects || '-'}</td>)}
                <td className="px-4 py-4 text-center font-black bg-rose-100 text-rose-700">
                  {yearSummary.sumDefects.toLocaleString()}
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4 border-r font-bold text-slate-400">검사수량 (EA)</td>
                {chartData.map((m, i) => <td key={i} className="px-2 py-4 border-r text-center text-slate-500">{m.inspectionQty > 0 ? m.inspectionQty.toLocaleString() : '-'}</td>)}
                <td className="px-4 py-4 text-center font-black bg-slate-100 text-slate-700">
                  {yearSummary.sumInspect.toLocaleString()}
                </td>
              </tr>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">고객사: <span className="text-blue-600">{selectedCustomer}</span></label>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">대상 고객사</label>
                  <input readOnly value={entryForm.customer} className="w-full bg-slate-100 border border-slate-200 p-3 rounded-xl font-bold outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">발생 월</label>
                  <select 
                    value={entryForm.month}
                    onChange={(e) => {
                      const m = parseInt(e.target.value);
                      const existing = metrics.find(item => item.customer === selectedCustomer && Number(item.year) === selectedYear && Number(item.month) === m);
                      setEntryForm({
                        ...entryForm, 
                        month: m,
                        target: existing?.target || 10,
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

              <div className="grid grid-cols-2 gap-4">
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

export default CustomerQuality;
