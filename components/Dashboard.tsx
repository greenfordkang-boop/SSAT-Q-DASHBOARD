
import React, { useMemo } from 'react';
import { NCREntry, CustomerMetric, SupplierMetric, ProcessQualityData, OutgoingMetric } from '../types';

interface DashboardProps {
  ncrData: NCREntry[];
  customerMetrics: CustomerMetric[];
  supplierMetrics: SupplierMetric[];
  processQualityData: ProcessQualityData[];
  outgoingMetrics: OutgoingMetric[];
}

// 원형 프로그레스 컴포넌트
const CircularProgress: React.FC<{ value: number; size?: number; strokeWidth?: number; color?: string }> = ({
  value,
  size = 120,
  strokeWidth = 8,
  color = '#10b981'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-slate-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{value}%</span>
      </div>
    </div>
  );
};

// 상태 뱃지 컴포넌트
const StatusBadge: React.FC<{ status: 'good' | 'warning' | 'danger' | 'neutral'; label: string }> = ({ status, label }) => {
  const colors = {
    good: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colors[status]}`}>
      {status === 'good' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>}
      {status === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>}
      {status === 'danger' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>}
      {label}
    </span>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ ncrData, customerMetrics, supplierMetrics, processQualityData, outgoingMetrics }) => {
  // NCR 통계
  const ncrStats = useMemo(() => {
    const total = ncrData.length;
    const closed = ncrData.filter(d => d.status === 'Closed').length;
    const open = ncrData.filter(d => d.status === 'Open').length;
    const delay = ncrData.filter(d => d.status === 'Delay').length;
    const closedRate = total > 0 ? Math.round((closed / total) * 100) : 0;
    return { total, closed, open, delay, closedRate };
  }, [ncrData]);

  // 고객품질 통계 (2026년 기준)
  const customerStats = useMemo(() => {
    const currentYear = 2026;
    const yearData = customerMetrics.filter(m => m.year === currentYear);

    const totalInspection = yearData.reduce((sum, m) => sum + m.inspectionQty, 0);
    const totalDefects = yearData.reduce((sum, m) => sum + m.defects, 0);
    const avgPpm = totalInspection > 0 ? Math.round((totalDefects / totalInspection) * 1000000) : 0;
    const avgTarget = yearData.length > 0 ? Math.round(yearData.reduce((sum, m) => sum + m.target, 0) / yearData.length) : 10;
    const achievement = avgTarget > 0 ? Math.round(Math.max(0, (1 - avgPpm / avgTarget) * 100)) : 100;

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
    const achievement = avgTarget > 0 ? Math.round(Math.max(0, (1 - avgPpm / avgTarget) * 100)) : 100;

    return { totalIncoming, totalInspection, totalDefects, avgPpm, avgTarget, achievement };
  }, [supplierMetrics]);

  // 공정품질 통계
  const processQualityStats = useMemo(() => {
    const totalProduction = processQualityData.reduce((sum, d) => sum + d.productionQty, 0);
    const totalDefects = processQualityData.reduce((sum, d) => sum + d.defectQty, 0);
    const totalAmount = processQualityData.reduce((sum, d) => sum + d.defectAmount, 0);
    const avgDefectRate = totalProduction > 0 ? ((totalDefects / totalProduction) * 100) : 0;
    const yieldRate = totalProduction > 0 ? Math.round((1 - totalDefects / totalProduction) * 100 * 100) / 100 : 100;

    return {
      totalProduction,
      totalDefects,
      totalAmount,
      avgDefectRate: Number(avgDefectRate.toFixed(2)),
      yieldRate
    };
  }, [processQualityData]);

  // 출하품질 통계 (2026년 기준)
  const outgoingStats = useMemo(() => {
    const currentYear = 2026;
    const yearData = outgoingMetrics.filter(m => m.year === currentYear);

    const totalInspection = yearData.reduce((sum, m) => sum + m.inspectionQty, 0);
    const totalDefects = yearData.reduce((sum, m) => sum + m.defects, 0);
    const avgPpm = totalInspection > 0 ? Math.round((totalDefects / totalInspection) * 1000000) : 0;
    const avgTarget = yearData.length > 0 ? Math.round(yearData.reduce((sum, m) => sum + m.target, 0) / yearData.length) : 10;
    const achievement = avgTarget > 0 ? Math.round(Math.max(0, (1 - avgPpm / avgTarget) * 100)) : 100;

    return { totalInspection, totalDefects, avgPpm, avgTarget, achievement };
  }, [outgoingMetrics]);

  // 전체 품질 점수 계산
  const overallScore = useMemo(() => {
    const scores = [
      ncrStats.closedRate,
      customerStats.achievement,
      supplierStats.achievement,
      processQualityStats.yieldRate,
      outgoingStats.achievement
    ].filter(s => s > 0);

    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [ncrStats, customerStats, supplierStats, processQualityStats, outgoingStats]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getStatus = (score: number): 'good' | 'warning' | 'danger' => {
    if (score >= 80) return 'good';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 히어로 섹션 - 전체 품질 점수 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 rounded-[2rem] shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>

        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="text-center lg:text-left">
            <p className="text-emerald-400 font-semibold text-sm tracking-wider uppercase mb-2">2026 Quality Dashboard</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              품질관리 종합현황
            </h1>
            <p className="text-slate-400 text-lg max-w-md">
              NCR, 고객품질, 수입검사, 공정품질, 출하품질의<br className="hidden lg:block" />
              실시간 품질 지표를 한눈에 확인하세요.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full blur-2xl"></div>
              <CircularProgress
                value={overallScore}
                size={180}
                strokeWidth={12}
                color={getScoreColor(overallScore)}
              />
            </div>
            <p className="text-slate-400 mt-4 font-medium">종합 품질 점수</p>
            <StatusBadge status={getStatus(overallScore)} label={overallScore >= 80 ? '우수' : overallScore >= 60 ? '보통' : '개선필요'} />
          </div>
        </div>

        {/* 핵심 KPI 요약 */}
        <div className="relative grid grid-cols-2 lg:grid-cols-5 gap-4 mt-10 pt-8 border-t border-slate-700/50">
          <div className="text-center">
            <p className="text-3xl lg:text-4xl font-bold text-white">{ncrStats.total}</p>
            <p className="text-slate-400 text-sm mt-1">NCR 총건수</p>
          </div>
          <div className="text-center">
            <p className="text-3xl lg:text-4xl font-bold text-white">{customerStats.avgPpm.toLocaleString()}</p>
            <p className="text-slate-400 text-sm mt-1">고객 PPM</p>
          </div>
          <div className="text-center">
            <p className="text-3xl lg:text-4xl font-bold text-white">{supplierStats.avgPpm.toLocaleString()}</p>
            <p className="text-slate-400 text-sm mt-1">수입 PPM</p>
          </div>
          <div className="text-center">
            <p className="text-3xl lg:text-4xl font-bold text-white">{processQualityStats.avgDefectRate}%</p>
            <p className="text-slate-400 text-sm mt-1">공정 불량률</p>
          </div>
          <div className="text-center">
            <p className="text-3xl lg:text-4xl font-bold text-white">{outgoingStats.avgPpm.toLocaleString()}</p>
            <p className="text-slate-400 text-sm mt-1">출하 PPM</p>
          </div>
        </div>
      </div>

      {/* 상세 카드 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* NCR 카드 */}
        <div className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">NCR</h3>
                <p className="text-slate-500 text-sm">부적합 보고서</p>
              </div>
            </div>
            <StatusBadge
              status={ncrStats.delay > 0 ? 'danger' : ncrStats.open > 0 ? 'warning' : 'good'}
              label={ncrStats.delay > 0 ? '지연발생' : ncrStats.open > 0 ? '처리중' : '양호'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-slate-500 text-xs font-medium mb-1">전체</p>
              <p className="text-3xl font-bold text-slate-900">{ncrStats.total}</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4">
              <p className="text-emerald-600 text-xs font-medium mb-1">완료</p>
              <p className="text-3xl font-bold text-emerald-600">{ncrStats.closed}</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4">
              <p className="text-amber-600 text-xs font-medium mb-1">진행중</p>
              <p className="text-3xl font-bold text-amber-600">{ncrStats.open}</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4">
              <p className="text-red-600 text-xs font-medium mb-1">지연</p>
              <p className="text-3xl font-bold text-red-600">{ncrStats.delay}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm">완료율</span>
            <span className="text-slate-900 font-bold">{ncrStats.closedRate}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-1000"
              style={{width: `${ncrStats.closedRate}%`}}
            ></div>
          </div>
        </div>

        {/* 고객품질 카드 */}
        <div className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">고객품질</h3>
                <p className="text-slate-500 text-sm">2026년 실적</p>
              </div>
            </div>
            <StatusBadge
              status={getStatus(customerStats.achievement)}
              label={customerStats.avgPpm <= customerStats.avgTarget ? '목표달성' : '미달'}
            />
          </div>

          <div className="flex items-center gap-6 mb-6">
            <CircularProgress
              value={Math.min(100, customerStats.achievement)}
              size={100}
              strokeWidth={8}
              color={getScoreColor(customerStats.achievement)}
            />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">실적 PPM</span>
                <span className={`font-bold text-lg ${customerStats.avgPpm <= customerStats.avgTarget ? 'text-emerald-600' : 'text-red-600'}`}>
                  {customerStats.avgPpm.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">목표 PPM</span>
                <span className="font-bold text-lg text-slate-900">{customerStats.avgTarget.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-slate-500 text-xs mb-1">검사수량</p>
              <p className="font-bold text-slate-900">{customerStats.totalInspection.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-slate-500 text-xs mb-1">불량수</p>
              <p className="font-bold text-slate-900">{customerStats.totalDefects.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* 수입검사 카드 */}
        <div className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">수입검사</h3>
                <p className="text-slate-500 text-sm">2026년 실적</p>
              </div>
            </div>
            <StatusBadge
              status={getStatus(supplierStats.achievement)}
              label={supplierStats.avgPpm <= supplierStats.avgTarget ? '목표달성' : '미달'}
            />
          </div>

          <div className="flex items-center gap-6 mb-6">
            <CircularProgress
              value={Math.min(100, supplierStats.achievement)}
              size={100}
              strokeWidth={8}
              color={getScoreColor(supplierStats.achievement)}
            />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">실적 PPM</span>
                <span className={`font-bold text-lg ${supplierStats.avgPpm <= supplierStats.avgTarget ? 'text-emerald-600' : 'text-red-600'}`}>
                  {supplierStats.avgPpm.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">목표 PPM</span>
                <span className="font-bold text-lg text-slate-900">{supplierStats.avgTarget.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-slate-500 text-xs mb-1">입고</p>
              <p className="font-bold text-slate-900 text-sm">{supplierStats.totalIncoming.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-slate-500 text-xs mb-1">검사</p>
              <p className="font-bold text-slate-900 text-sm">{supplierStats.totalInspection.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-slate-500 text-xs mb-1">불량</p>
              <p className="font-bold text-slate-900 text-sm">{supplierStats.totalDefects.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* 공정품질 카드 - 와이드 */}
        <div className="group lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">공정품질</h3>
                <p className="text-slate-500 text-sm">사출 / 도장 / 조립</p>
              </div>
            </div>
            {processQualityData.length > 0 && (
              <StatusBadge
                status={processQualityStats.avgDefectRate < 1 ? 'good' : processQualityStats.avgDefectRate < 3 ? 'warning' : 'danger'}
                label={processQualityStats.avgDefectRate < 1 ? '양호' : processQualityStats.avgDefectRate < 3 ? '주의' : '개선필요'}
              />
            )}
          </div>

          {processQualityData.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm font-medium">생산수량</p>
                </div>
                <p className="text-3xl font-bold text-slate-900">{processQualityStats.totalProduction.toLocaleString()}</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-red-200 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-600 text-sm font-medium">불량수량</p>
                </div>
                <p className="text-3xl font-bold text-red-600">{processQualityStats.totalDefects.toLocaleString()}</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-amber-600 text-sm font-medium">불량금액</p>
                </div>
                <p className="text-3xl font-bold text-amber-600">₩{processQualityStats.totalAmount.toLocaleString()}</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-emerald-600 text-sm font-medium">수율</p>
                </div>
                <p className="text-3xl font-bold text-emerald-600">{processQualityStats.yieldRate}%</p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-12 rounded-2xl text-center">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-900 text-lg mb-2">데이터 없음</h4>
              <p className="text-slate-500 text-sm">공정품질 탭에서 엑셀 파일을 업로드하세요.</p>
            </div>
          )}
        </div>

        {/* 출하품질 카드 */}
        <div className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">출하품질</h3>
                <p className="text-slate-500 text-sm">2026년 실적</p>
              </div>
            </div>
            {outgoingMetrics.length > 0 && (
              <StatusBadge
                status={getStatus(outgoingStats.achievement)}
                label={outgoingStats.avgPpm <= outgoingStats.avgTarget ? '목표달성' : '미달'}
              />
            )}
          </div>

          {outgoingMetrics.length > 0 ? (
            <>
              <div className="flex items-center gap-6 mb-6">
                <CircularProgress
                  value={Math.min(100, outgoingStats.achievement)}
                  size={100}
                  strokeWidth={8}
                  color={getScoreColor(outgoingStats.achievement)}
                />
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">실적 PPM</span>
                    <span className={`font-bold text-lg ${outgoingStats.avgPpm <= outgoingStats.avgTarget ? 'text-emerald-600' : 'text-red-600'}`}>
                      {outgoingStats.avgPpm.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">목표 PPM</span>
                    <span className="font-bold text-lg text-slate-900">{outgoingStats.avgTarget.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-slate-500 text-xs mb-1">검사수량</p>
                  <p className="font-bold text-slate-900">{outgoingStats.totalInspection.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-slate-500 text-xs mb-1">불량수</p>
                  <p className="font-bold text-slate-900">{outgoingStats.totalDefects.toLocaleString()}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-12 rounded-2xl text-center">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-900 text-lg mb-2">데이터 없음</h4>
              <p className="text-slate-500 text-sm">출하품질 탭에서 지표를 입력하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
