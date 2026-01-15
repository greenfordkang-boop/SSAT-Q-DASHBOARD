
import React from 'react';
import { NCREntry } from '../types';

interface DashboardProps {
  data: NCREntry[];
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const total = data.length;
  const closed = data.filter(d => d.status === 'Closed').length;
  const open = data.filter(d => d.status === 'Open').length;
  const delay = data.filter(d => d.status === 'Delay').length;

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
        <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">품질관리 종합 대시보드</h2>
        <p className="text-slate-500 leading-relaxed max-w-2xl mx-auto">
          고객품질 / 수입 / 공정(사출, 도장, 조립) / 출하품질 지표를 <br/>
          실시간 데이터 분석을 통해 종합적으로 모니터링합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase">전체 부적합</p>
          <p className="text-4xl font-black mt-2 text-slate-900">{total}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-emerald-500 uppercase">조치 완료</p>
          <p className="text-4xl font-black mt-2 text-emerald-600">{closed}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-blue-500 uppercase">진행 (Open)</p>
          <p className="text-4xl font-black mt-2 text-blue-600">{open}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-rose-500 uppercase">지연 (Delay)</p>
          <p className="text-4xl font-black mt-2 text-rose-600">{delay}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-3xl text-white shadow-xl">
           <h3 className="text-lg font-black mb-4 flex items-center gap-2">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             부문별 목표 달성률
           </h3>
           <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-bold mb-2"><span>고객품질</span><span>92%</span></div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden"><div className="bg-white h-full" style={{width: '92%'}}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-bold mb-2"><span>수입검사</span><span>85%</span></div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden"><div className="bg-white h-full" style={{width: '85%'}}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-bold mb-2"><span>출하품질</span><span>100%</span></div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden"><div className="bg-white h-full" style={{width: '100%'}}></div></div>
              </div>
           </div>
        </div>
        
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center">
          <div className="text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h4 className="font-black text-slate-800">최근 업데이트</h4>
            <p className="text-slate-400 text-sm mt-1">실시간 품질 지표 동기화 진행 중...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
