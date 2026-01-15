
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const data = [
  { name: '1월', 사출: 450, 도장: 1200, 조립: 320 },
  { name: '2월', 사출: 380, 도장: 1100, 조립: 280 },
  { name: '3월', 사출: 420, 도장: 1350, 조립: 410 },
  { name: '4월', 사출: 310, 도장: 1050, 조립: 190 },
  { name: '5월', 사출: 290, 도장: 980, 조립: 210 },
  { name: '6월', 사출: 350, 도장: 1150, 조립: 240 },
];

const ProcessQuality: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
        <div className="bg-blue-50 p-6 rounded-full mb-4">
           <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-2">MES 주간 실적 데이터 업로드</h3>
        <p className="text-slate-500 text-sm mb-6 max-w-md">엑셀(CSV) 자료를 업로드하면 자동으로 사출, 도장, 조립 공정의 품질 지표를 분석하여 그래프로 표시합니다.</p>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-blue-700 active:scale-95 transition-all">파일 선택 및 분석 시작</button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-6 flex justify-between">
          <span>공정별 품질 추이 분석 (ppm)</span>
          <div className="flex gap-4 text-[10px]">
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> 사출</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded-full"></div> 도장</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> 조립</span>
          </div>
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
              <Line type="monotone" dataKey="사출" stroke="#3b82f6" strokeWidth={3} dot={{r: 5}} />
              <Line type="monotone" dataKey="도장" stroke="#f43f5e" strokeWidth={3} dot={{r: 5}} />
              <Line type="monotone" dataKey="조립" stroke="#10b981" strokeWidth={3} dot={{r: 5}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProcessQuality;
