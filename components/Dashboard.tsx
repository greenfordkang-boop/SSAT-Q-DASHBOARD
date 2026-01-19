
import React, { useMemo } from 'react';
import { NCREntry, CustomerMetric, SupplierMetric } from '../types';

interface DashboardProps {
  ncrData: NCREntry[];
  customerMetrics: CustomerMetric[];
  supplierMetrics: SupplierMetric[];
}

const Dashboard: React.FC<DashboardProps> = ({ ncrData, customerMetrics, supplierMetrics }) => {
  // NCR 통계
  const ncrStats = useMemo(() => {
    const total = ncrData.length;
    const closed = ncrData.filter(d => d.status === 'Closed').length;
    const open = ncrData.filter(d => d.status === 'Open').length;
    const delay = ncrData.filter(d => d.status === 'Delay').length;
    return { total, closed, open, delay };
  }, [ncrData]);

  // 고객품질 통계 (2026년 기준)
  const customerStats = useMemo(() => {
    const currentYear = 2026;
    const yearData = customerMetrics.filter(m => m.year === currentYear);

    const totalInspection = yearData.reduce((sum, m) => sum + m.inspectionQty, 0);
    const totalDefects = yearData.reduce((sum, m) => sum + m.defects, 0);
    const avgPpm = totalInspection > 0 ? Math.round((totalDefects / totalInspection) * 1000000) : 0;
    const avgTarget = yearData.length > 0 ? Math.round(yearData.reduce((sum, m) => sum + m.target, 0) / yearData.length) : 10;
    const achievement = avgTarget > 0 ? Math.min(100, Math.round((1 - avgPpm / avgTarget) * 100)) : 0;

    return { totalInspection, totalDefects, avgPpm, avgTarget, achievement };
  }, [customerMetrics]);

  // 수입검사 통계 (2026년 기준)
  const supplierStats = useMemo(() => {
    const currentYear = 2026;
    const yearData = supplierMetrics.filter(m => m.year === currentYear);

    const totalIncoming = yearData.reduce((sum, m) => sum + m.incomingQty, 0);
    const totalInspection = yearData.reduce((sum, m) => sum + m.inspectionQty, 0);
    const totalDefects = yearData.reduce((sum, m) => sum + m.defects, 0);
    const avgPpm = totalInspection > 0 ? Math.round((totalDefects / totalInspection) * 1000000) : 0;
    const avgTarget = yearData.length > 0 ? Math.round(yearData.reduce((sum, m) => sum + m.target, 0) / yearData.length) : 7500;
    const achievement = avgTarget > 0 ? Math.min(100, Math.round((1 - avgPpm / avgTarget) * 100)) : 0;

    return { totalIncoming, totalInspection, totalDefects, avgPpm, avgTarget, achievement };
  }, [supplierMetrics]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 헤더 */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">품질관리 종합 대시보드</h2>
        <p className="text-slate-500 leading-relaxed max-w-2xl mx-auto">
          NCR / 고객품질 / 수입검사 / 공정품질 / 출하품질 지표를<br/>
          실시간 데이터 분석을 통해 종합적으로 모니터링합니다.
        </p>
      </div>

      {/* 1. NCR 현황 */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          1. NCR (부적합 보고서)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">전체 부적합</p>
            <p className="text-4xl font-bold text-slate-900">{ncrStats.total}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">조치 완료</p>
            <p className="text-4xl font-bold text-slate-900">{ncrStats.closed}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">진행 중 (OPEN)</p>
            <p className="text-4xl font-bold text-slate-900">{ncrStats.open}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">지연 (DELAY)</p>
            <p className="text-4xl font-bold text-slate-900">{ncrStats.delay}</p>
          </div>
        </div>
      </div>

      {/* 2. 고객품질 */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          2. 고객품질 (2026년)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">검사수량</p>
            <p className="text-3xl font-bold text-slate-900">{customerStats.totalInspection.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">불량수</p>
            <p className="text-3xl font-bold text-slate-900">{customerStats.totalDefects.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">실적 PPM</p>
            <p className="text-3xl font-bold text-slate-900">{customerStats.avgPpm.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">목표 PPM</p>
            <p className="text-3xl font-bold text-slate-900">{customerStats.avgTarget.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">달성률</p>
            <p className="text-3xl font-bold text-slate-900">{customerStats.achievement}%</p>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
              <div className="bg-slate-900 h-full transition-all duration-500" style={{width: `${Math.min(100, customerStats.achievement)}%`}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 수입검사 */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          3. 수입검사 (2026년)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">입고수량</p>
            <p className="text-3xl font-bold text-slate-900">{supplierStats.totalIncoming.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">검사수량</p>
            <p className="text-3xl font-bold text-slate-900">{supplierStats.totalInspection.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">불량수</p>
            <p className="text-3xl font-bold text-slate-900">{supplierStats.totalDefects.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">실적 PPM</p>
            <p className="text-3xl font-bold text-slate-900">{supplierStats.avgPpm.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">목표 PPM</p>
            <p className="text-3xl font-bold text-slate-900">{supplierStats.avgTarget.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">달성률</p>
            <p className="text-3xl font-bold text-slate-900">{supplierStats.achievement}%</p>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
              <div className="bg-slate-900 h-full transition-all duration-500" style={{width: `${Math.min(100, supplierStats.achievement)}%`}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 공정품질 (준비 중) */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          4. 공정품질 (사출 / 도장 / 조립)
        </h3>
        <div className="bg-slate-50 p-12 rounded-2xl border border-slate-200 text-center">
          <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h4 className="font-bold text-slate-900 text-xl mb-2">데이터 준비 중</h4>
          <p className="text-slate-500 text-sm">공정품질 지표 데이터 입력 기능을 개발 중입니다.</p>
        </div>
      </div>

      {/* 5. 출하품질 */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          5. 출하품질
        </h3>
        <div className="bg-slate-50 p-12 rounded-2xl border border-slate-200 text-center">
          <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h4 className="font-bold text-slate-900 text-xl mb-2">데이터 준비 중</h4>
          <p className="text-slate-500 text-sm">출하품질 지표 데이터 입력 기능을 개발 중입니다.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
