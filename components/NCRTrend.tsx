import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { NCREntry } from '../types';

interface NCRTrendProps {
  data: NCREntry[];
}

const COLORS = {
  closed: '#10b981',
  open: '#3b82f6',
  delay: '#f43f5e',
  closureRate: '#8b5cf6',
};

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function NCRTrend({ data }: NCRTrendProps) {
  // KPI
  const kpi = useMemo(() => {
    const total = data.length;
    const open = data.filter(d => d.status === 'Open').length;
    const closed = data.filter(d => d.status === 'Closed').length;
    const delay = data.filter(d => d.status === 'Delay').length;
    const closureRate = total > 0 ? Math.round((closed / total) * 100) : 0;
    return { total, open, closed, delay, closureRate };
  }, [data]);

  // Monthly data
  const monthlyData = useMemo(() => {
    const buckets = MONTH_LABELS.map((name, i) => ({
      name,
      month: i + 1,
      total: 0,
      open: 0,
      closed: 0,
      delay: 0,
      closureRate: 0,
    }));

    data.forEach(d => {
      const idx = d.month - 1;
      if (idx >= 0 && idx < 12) {
        buckets[idx].total++;
        if (d.status === 'Closed') buckets[idx].closed++;
        else if (d.status === 'Open') buckets[idx].open++;
        else if (d.status === 'Delay') buckets[idx].delay++;
      }
    });

    buckets.forEach(b => {
      b.closureRate = b.total > 0 ? Math.round((b.closed / b.total) * 100) : 0;
    });

    return buckets;
  }, [data]);

  // Vendor (customer) data — top 10
  const vendorData = useMemo(() => {
    const map = new Map<string, { name: string; total: number; open: number; closed: number; delay: number }>();

    data.forEach(d => {
      const key = d.customer || '미지정';
      if (!map.has(key)) {
        map.set(key, { name: key, total: 0, open: 0, closed: 0, delay: 0 });
      }
      const entry = map.get(key)!;
      entry.total++;
      if (d.status === 'Closed') entry.closed++;
      else if (d.status === 'Open') entry.open++;
      else if (d.status === 'Delay') entry.delay++;
    });

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [data]);

  if (data.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">총</span>
            <span className="text-2xl font-black text-slate-900">{kpi.total}건</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.open }} />
            <span className="text-sm text-slate-600">Open</span>
            <span className="text-sm font-bold text-blue-600">{kpi.open}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.closed }} />
            <span className="text-sm text-slate-600">Closed</span>
            <span className="text-sm font-bold text-emerald-600">{kpi.closed}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.delay }} />
            <span className="text-sm text-slate-600">Delay</span>
            <span className="text-sm font-bold text-rose-600">{kpi.delay}</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-slate-600">완료율</span>
            <span className="text-sm font-bold text-violet-600">{kpi.closureRate}%</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">월별 NCR 발생 추이</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)', fontSize: '12px' }}
                  formatter={(value: number, name: string) => {
                    if (name === '완료율') return [`${value}%`, name];
                    return [`${value}건`, name];
                  }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar yAxisId="left" name="Closed" dataKey="closed" stackId="status" fill={COLORS.closed} radius={[0, 0, 0, 0]} barSize={20} />
                <Bar yAxisId="left" name="Open" dataKey="open" stackId="status" fill={COLORS.open} radius={[0, 0, 0, 0]} barSize={20} />
                <Bar yAxisId="left" name="Delay" dataKey="delay" stackId="status" fill={COLORS.delay} radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="right" name="완료율" dataKey="closureRate" type="monotone" stroke={COLORS.closureRate} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.closureRate, stroke: '#fff', strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendor Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">업체별 NCR 현황 (Top {vendorData.length})</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)', fontSize: '12px' }}
                  formatter={(value: number, name: string) => [`${value}건`, name]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar name="Closed" dataKey="closed" stackId="status" fill={COLORS.closed} barSize={16} />
                <Bar name="Open" dataKey="open" stackId="status" fill={COLORS.open} barSize={16} />
                <Bar name="Delay" dataKey="delay" stackId="status" fill={COLORS.delay} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
