import { useMemo } from 'react';
import { ComposedChart, Bar, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { DefectTypeAnalysis } from '../types';

interface DefectTypeAnalysisSectionProps {
  defectTypeAnalysis: DefectTypeAnalysis[];
  title: string;
}

export default function DefectTypeAnalysisSection({ defectTypeAnalysis, title }: DefectTypeAnalysisSectionProps) {
  const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num);

  return (
    <div>
      {defectTypeAnalysis && defectTypeAnalysis.length > 0 ? (
        <>
          <h3 className="text-lg font-bold text-slate-900 mb-6">{title}</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={(() => {
                  const top10 = defectTypeAnalysis.slice(0, 10);
                  let cumulative = 0;
                  return top10.map(item => {
                    cumulative += item.percentage;
                    return {
                      ...item,
                      cumulativePercentage: cumulative
                    };
                  });
                })()}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="defectType"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  label={{ value: '불량 수량 (건)', angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  label={{ value: '누적 비율 (%)', angle: 90, position: 'insideRight', style: { fill: '#64748b' } }}
                  tick={{ fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any, name: string) => {
                    if (name === '불량 수량') return [`${value}건`, name];
                    if (name === '누적 비율') return [`${Number(value).toFixed(1)}%`, name];
                    return [value, name];
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="count"
                  name="불량 수량"
                  fill="#8b5cf6"
                  radius={[8, 8, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativePercentage"
                  name="누적 비율"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-6 mt-12">불량유형별 비율</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={defectTypeAnalysis.slice(0, 10)}
                  dataKey="percentage"
                  nameKey="defectType"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ defectType, percentage }) => `${defectType}: ${percentage.toFixed(1)}%`}
                  labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                >
                  {defectTypeAnalysis.slice(0, 10).map((entry, index) => {
                    const colors = [
                      '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b',
                      '#ef4444', '#06b6d4', '#8b5cf6', '#6366f1', '#14b8a6'
                    ];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any, name: string) => [`${Number(value).toFixed(1)}%`, name]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => {
                    const item = defectTypeAnalysis.find(d => d.defectType === value);
                    return `${value} (${item ? item.percentage.toFixed(1) : '0.0'}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">불량유형 데이터가 없습니다</h3>
          <p className="text-slate-600 mb-4">불량유형 파일을 업로드하여 분석을 시작하세요</p>
        </div>
      )}
    </div>
  );
}
