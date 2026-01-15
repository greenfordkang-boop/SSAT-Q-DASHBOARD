
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

const data = [
  { name: '신소재산업', incoming: 1520, defect: 3, ppm: 19355 },
  { name: '송현테크', incoming: 15905, defect: 14, ppm: 13487 },
  { name: '성진로지스', incoming: 1315, defect: 0, ppm: 0 },
  { name: '주은테크', incoming: 0, defect: 0, ppm: 0 },
  { name: '동아전기', incoming: 6913, defect: 0, ppm: 0 },
];

const IncomingQuality: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex justify-between">
            <span>업체별 PPM 실적 현황</span>
            <span className="text-blue-600 text-[10px]">목표: 7,500 ppm</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="ppm" radius={[4,4,0,0]} barSize={40}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.ppm > 7500 ? '#f43f5e' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <span className="text-[10px] font-bold text-slate-400">금주 입고 총계</span>
               <p className="text-2xl font-black text-slate-800">25,653 EA</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
               <span className="text-[10px] font-bold text-rose-400">금주 불량 총계</span>
               <p className="text-2xl font-black text-rose-600">17 EA</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
               <span className="text-[10px] font-bold text-blue-400">금주 평균 PPM</span>
               <p className="text-2xl font-black text-blue-600">662 PPM</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
               <span className="text-[10px] font-bold text-emerald-400">목표 달성업체</span>
               <p className="text-2xl font-black text-emerald-600">3 / 5</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold bg-slate-50 flex items-center justify-between">
          <span>협력업체별 품질 지표 (PPM)</span>
          <span className="text-[10px] text-slate-400">25년 12월 기준</span>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 font-black">
            <tr>
              <th className="px-4 py-3 border-r">업체명</th>
              <th className="px-4 py-3 border-r text-center">입고수량</th>
              <th className="px-4 py-3 border-r text-center">검사수량</th>
              <th className="px-4 py-3 border-r text-center text-rose-600">불량수</th>
              <th className="px-4 py-3 border-r text-center bg-slate-200">PPM</th>
              <th className="px-4 py-3 text-center">전월대비</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(item => (
              <tr key={item.name} className="hover:bg-slate-50">
                <td className="px-4 py-3 border-r font-bold">{item.name}</td>
                <td className="px-4 py-3 border-r text-center">{item.incoming.toLocaleString()}</td>
                <td className="px-4 py-3 border-r text-center">{item.incoming.toLocaleString()}</td>
                <td className="px-4 py-3 border-r text-center font-bold text-rose-500">{item.defect}</td>
                <td className="px-4 py-3 border-r text-center font-black bg-slate-50">{item.ppm.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  {item.ppm > 0 ? (
                    <span className="text-rose-500 font-bold">▲</span>
                  ) : (
                    <span className="text-blue-500 font-bold">➡</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IncomingQuality;
