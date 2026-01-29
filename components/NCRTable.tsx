
import React, { useState } from 'react';
import { NCREntry, NCRStatus, NCRAttachment } from '../types';

interface NCRTableProps {
  data: NCREntry[];
  onEdit: (entry: NCREntry) => void;
  onDelete: (id: string) => void;
  onOpen8D: (entry: NCREntry) => void;
}

const NCRTable: React.FC<NCRTableProps> = ({ data, onEdit, onDelete, onOpen8D }) => {
  const [filter, setFilter] = useState('');

  const filteredData = data.filter(item => 
    item.customer.toLowerCase().includes(filter.toLowerCase()) ||
    item.model.toLowerCase().includes(filter.toLowerCase()) ||
    item.defectContent.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusBadge = (status: NCRStatus) => {
    switch(status) {
      case 'Closed': return <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold">완료</span>;
      case 'Delay': return <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[9px] font-bold">지연</span>;
      default: return <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold">진행</span>;
    }
  };

  const openAttachment = (file: NCRAttachment) => {
    const blob = b64toBlob(file.data, file.type);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const b64toBlob = (b64Data: string, contentType: string = '', sliceSize: number = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) { byteNumbers[i] = slice.charCodeAt(i); }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <input 
          type="text" 
          placeholder="데이터 필터링 검색..."
          className="pl-4 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 w-64 outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px] text-left border-collapse min-w-[2100px]">
          <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 z-[60] border-b border-slate-200">
            <tr>
              <th className="px-2 py-3 whitespace-nowrap text-center">NO</th>
              <th className="px-2 py-3 whitespace-nowrap text-center">발생일자</th>
              <th className="px-2 py-3 whitespace-nowrap">고객사</th>
              <th className="px-2 py-3 whitespace-nowrap">모델</th>
              <th className="px-2 py-3 whitespace-nowrap">품명</th>
              <th className="px-2 py-3 min-w-[200px]">불량 내용</th>
              <th className="px-2 py-3 whitespace-nowrap text-center">대책서 파일</th>
              <th className="px-2 py-3 min-w-[300px]">원인 및 개선대책 (8D 동기화)</th>
              <th className="px-2 py-3 min-w-[150px]">유효성점검</th>
              <th className="px-2 py-3 whitespace-nowrap text-center">상태</th>
              <th className="px-2 py-3 whitespace-nowrap text-center sticky right-0 bg-slate-100 border-l border-slate-300 z-[60] shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">관리도구</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-2 py-3 text-center text-slate-400">{idx + 1}</td>
                <td className="px-2 py-3 text-center">{item.month}/{item.day}</td>
                <td className="px-2 py-3 font-bold text-slate-700">{item.customer}</td>
                <td className="px-2 py-3">{item.model}</td>
                <td className="px-2 py-3">{item.partName}</td>
                <td className="px-2 py-3 whitespace-pre-wrap">{item.defectContent}</td>
                <td className="px-2 py-3 text-center">
                  {item.attachments && item.attachments.length > 0 ? (
                    <div className="flex flex-col items-center gap-1">
                       <button 
                         onClick={() => openAttachment(item.attachments[item.attachments.length - 1])}
                         className="px-2 py-0.5 bg-blue-600 text-white rounded text-[9px] font-black hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1"
                       >
                         <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                         PDF OPEN
                       </button>
                       <span className="text-[8px] text-slate-400 font-bold">{item.attachments.length} files attached</span>
                    </div>
                  ) : <span className="text-slate-300">-</span>}
                </td>
                <td className="px-2 py-3 whitespace-pre-wrap">
                  <div className="flex flex-col gap-1">
                    <div className="bg-blue-50/50 p-1.5 rounded border border-blue-100/50">
                      <span className="text-blue-700 font-bold mr-1">[원인]</span>
                      <span className="text-slate-600 leading-tight">{item.rootCause || '분석 중'}</span>
                    </div>
                    <div className="bg-emerald-50/50 p-1.5 rounded border border-emerald-100/50">
                      <span className="text-emerald-700 font-bold mr-1">[대책]</span>
                      <span className="text-slate-600 leading-tight">{item.countermeasure || '수립 중'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-pre-wrap">
                  {item.validationCheck ? (
                    <div className="bg-purple-50/50 p-1.5 rounded border border-purple-100/50">
                      <span className="text-purple-700 font-bold mr-1">[유효성]</span>
                      <span className="text-slate-600 leading-tight">{item.validationCheck}</span>
                    </div>
                  ) : (
                    <span className="text-slate-300 text-center block">-</span>
                  )}
                </td>
                <td className="px-2 py-3 text-center">{getStatusBadge(item.status)}</td>
                <td className="px-2 py-3 text-center sticky right-0 bg-white border-l border-slate-200 z-[50] group-hover:bg-slate-50">
                  <div className="flex justify-center items-center gap-2 pointer-events-auto relative z-[70]">
                    <button onClick={() => onOpen8D(item)} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black hover:bg-blue-700 transition-all shadow-md active:scale-95">8D Report</button>
                    <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">✏️</button>
                    <button onClick={() => onDelete(item.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all">
                       <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NCRTable;
