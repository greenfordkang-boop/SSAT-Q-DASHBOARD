
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const data = [
  { name: '1월', goal: 4000, actual: 256, qty: 56 },
  { name: '2월', goal: 4000, actual: 428, qty: 123 },
  { name: '3월', goal: 4000, actual: 770, qty: 234 },
  { name: '4월', goal: 4000, actual: 467, qty: 83 },
  { name: '5월', goal: 4000, actual: 728, qty: 57 },
  { name: '6월', goal: 4000, actual: 212, qty: 45 },
];

const OutgoingQuality: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex justify-between">
            <span>25년 출하 품질 목표 및 실적</span>
            <span className="text-emerald-500 font-black">단위: ppm</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip />
                <Legend iconType="circle" />
                <Bar dataKey="goal" fill="#cbd5e1" name="목표" barSize={25} radius={[4,4,0,0]} />
                <Bar dataKey="actual" fill="#10b981" name="실적" barSize={25} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-sm">2025년 공정별 불량 수량 (12월 5주차)</div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead className="bg-slate-100 font-black">
                <tr>
                  <th className="px-2 py-3 border-r">구분</th>
                  <th className="px-2 py-3 border-r">사출</th>
                  <th className="px-2 py-3 border-r">도금/증착</th>
                  <th className="px-2 py-3 border-r">레이저/인쇄</th>
                  <th className="px-2 py-3 border-r">도장</th>
                  <th className="px-2 py-3 border-r">조립</th>
                  <th className="px-2 py-3">기타</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-2 py-4 border-r bg-slate-50 font-bold">불량수량</td>
                  <td className="px-2 py-4 border-r">-</td>
                  <td className="px-2 py-4 border-r font-bold text-rose-500">1</td>
                  <td className="px-2 py-4 border-r">-</td>
                  <td className="px-2 py-4 border-r font-bold text-rose-500">4</td>
                  <td className="px-2 py-4 border-r font-bold text-rose-500">7</td>
                  <td className="px-2 py-4">-</td>
                </tr>
                <tr>
                  <td className="px-2 py-10 border-r bg-slate-50 font-bold">불량유형</td>
                  <td className="px-2 py-10 border-r text-slate-400">-</td>
                  <td className="px-2 py-10 border-r font-medium">찍힘(1)</td>
                  <td className="px-2 py-10 border-r text-slate-400">-</td>
                  <td className="px-2 py-10 border-r font-medium">돌들이(4)</td>
                  <td className="px-2 py-10 border-r font-medium">찍힘(2)<br/>S/C(1)<br/>누락(4)</td>
                  <td className="px-2 py-10 text-slate-400">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutgoingQuality;
