
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { IncomingMetric } from '../types';
import { SUPPLIER_LIST } from '../data/mockData';

interface IncomingQualityProps {
  metrics: IncomingMetric[];
  onSave: (data: IncomingMetric) => Promise<boolean>;
}

const IncomingQuality: React.FC<IncomingQualityProps> = ({ metrics, onSave }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<IncomingMetric>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    supplier: SUPPLIER_LIST[0],
    incomingQty: 0,
    defectQty: 0,
    ppm: 0
  });

  // 선택된 연/월에 해당하는 데이터 필터링
  const filteredMetrics = useMemo(() => {
    return metrics.filter(m => m.year === selectedYear && m.month === selectedMonth);
  }, [metrics, selectedYear, selectedMonth]);

  // 차트용 데이터 (표시할 데이터가 없으면 빈 배열)
  const chartData = useMemo(() => {
    return filteredMetrics.map(m => ({
      name: m.supplier,
      incoming: m.incomingQty,
      defect: m.defectQty,
      ppm: m.ppm
    }));
  }, [filteredMetrics]);

  // 요약 통계 계산
  const summary = useMemo(() => {
    const totalIncoming = filteredMetrics.reduce((sum, m) => sum + m.incomingQty, 0);
    const totalDefects = filteredMetrics.reduce((sum, m) => sum + m.defectQty, 0);
    const avgPpm = totalIncoming > 0 ? Math.round((totalDefects / totalIncoming) * 1000000) : 0;
    const achievedCount = filteredMetrics.filter(m => m.ppm <= 7500).length; // 목표 7500 미만 달성

    return { totalIncoming, totalDefects, avgPpm, achievedCount, totalSuppliers: filteredMetrics.length };
  }, [filteredMetrics]);

  // 입력 폼 PPM 자동 계산
  const handleFormChange = (key: keyof IncomingMetric, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'incomingQty' || key === 'defectQty') {
        const inc = Number(next.incomingQty);
        const def = Number(next.defectQty);
        next.ppm = inc > 0 ? Math.round((def / inc) * 1000000) : 0;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.incomingQty < 0 || formData.defectQty < 0) {
      alert("수량은 0 이상이어야 합니다.");
      return;
    }
    
    setIsSaving(true);
    const success = await onSave(formData);
    setIsSaving(false);

    if (success) {
      alert("저장되었습니다.");
      setShowModal(false);
    }
  };

  const openModalForEdit = (metric?: IncomingMetric) => {
    if (metric) {
      setFormData(metric);
    } else {
      setFormData({
        year: selectedYear,
        month: selectedMonth,
        supplier: SUPPLIER_LIST[0],
        incomingQty: 0,
        defectQty: 0,
        ppm: 0
      });
    }
    setShowModal(true);
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
        <button 
          onClick={() => openModalForEdit()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          협력업체 실적 등록
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex justify-between">
            <span>업체별 PPM 실적 현황 ({selectedMonth}월)</span>
            <span className="text-blue-600 text-[10px]">목표: 7,500 ppm</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartData.length > 0 ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="ppm" radius={[4,4,0,0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.ppm > 7500 ? '#f43f5e' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">데이터가 없습니다.</div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <span className="text-[10px] font-bold text-slate-400">당월 입고 총계</span>
               <p className="text-2xl font-black text-slate-800">{summary.totalIncoming.toLocaleString()} EA</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
               <span className="text-[10px] font-bold text-rose-400">당월 불량 총계</span>
               <p className="text-2xl font-black text-rose-600">{summary.totalDefects.toLocaleString()} EA</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
               <span className="text-[10px] font-bold text-blue-400">당월 평균 PPM</span>
               <p className="text-2xl font-black text-blue-600">{summary.avgPpm.toLocaleString()} PPM</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
               <span className="text-[10px] font-bold text-emerald-400">목표 달성업체</span>
               <p className="text-2xl font-black text-emerald-600">{summary.achievedCount} / {summary.totalSuppliers}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold bg-slate-50 flex items-center justify-between">
          <span>협력업체별 품질 지표 (PPM) - {selectedYear}년 {selectedMonth}월 기준</span>
          <span className="text-[10px] text-slate-400">실시간 데이터</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 font-black">
                <tr>
                <th className="px-4 py-3 border-r">업체명</th>
                <th className="px-4 py-3 border-r text-center">입고수량</th>
                <th className="px-4 py-3 border-r text-center">검사수량</th>
                <th className="px-4 py-3 border-r text-center text-rose-600">불량수</th>
                <th className="px-4 py-3 border-r text-center bg-slate-200">PPM</th>
                <th className="px-4 py-3 text-center">관리</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredMetrics.length > 0 ? filteredMetrics.map(item => (
                <tr key={item.supplier} className="hover:bg-slate-50">
                    <td className="px-4 py-3 border-r font-bold">{item.supplier}</td>
                    <td className="px-4 py-3 border-r text-center">{item.incomingQty.toLocaleString()}</td>
                    <td className="px-4 py-3 border-r text-center">{item.incomingQty.toLocaleString()}</td>
                    <td className="px-4 py-3 border-r text-center font-bold text-rose-500">{item.defectQty}</td>
                    <td className="px-4 py-3 border-r text-center font-black bg-slate-50">{item.ppm.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                        <button onClick={() => openModalForEdit(item)} className="text-blue-600 font-bold hover:underline">수정</button>
                    </td>
                </tr>
                )) : (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-400">등록된 데이터가 없습니다.</td></tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* 실적 입력 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
               <h3 className="font-black">수입검사 실적 등록</h3>
               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">대상 연/월</label>
                    <div className="flex gap-2">
                        <input readOnly value={`${formData.year}년`} className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-xl font-bold text-center text-xs" />
                        <input readOnly value={`${formData.month}월`} className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-xl font-bold text-center text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">협력업체</label>
                    <select 
                        value={formData.supplier}
                        onChange={(e) => handleFormChange('supplier', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-xs"
                    >
                        {SUPPLIER_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">입고 수량</label>
                  <input 
                    type="number"
                    value={formData.incomingQty}
                    onChange={(e) => handleFormChange('incomingQty', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">불량 수량</label>
                  <input 
                    type="number"
                    value={formData.defectQty}
                    onChange={(e) => handleFormChange('defectQty', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-rose-600"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Calculated PPM</span>
                  <span className="text-xs font-bold text-blue-700">산출 PPM</span>
                </div>
                <span className="text-2xl font-black text-blue-700">{formData.ppm.toLocaleString()}</span>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '실적 데이터 저장'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomingQuality;
