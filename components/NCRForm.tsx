
import React, { useState, useEffect, useRef } from 'react';
import { NCREntry, NCRAttachment } from '../types';
import { CUSTOMER_LIST } from '../data/mockData';

interface NCRFormProps {
  initialData?: NCREntry | null;
  onSave: (entry: NCREntry) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

const NCRForm: React.FC<NCRFormProps> = ({ initialData, onSave, onDelete, onCancel }) => {
  const [formData, setFormData] = useState<Partial<NCREntry>>({
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    source: '',
    customer: '',
    model: '',
    partName: '',
    partNo: '',
    defectContent: '',
    outflowCause: '',
    rootCause: '',
    countermeasure: '',
    planDate: new Date().toISOString().split('T')[0],
    resultDate: '',
    effectivenessCheck: '',
    validationCheck: '',
    status: 'Open',
    progressRate: 0,
    remarks: '',
    attachments: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData, attachments: initialData.attachments || [] });
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAttachment: NCRAttachment = {
          name: file.name,
          data: (reader.result as string).split(',')[1],
          type: file.type
        };
        setFormData(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer?.trim()) {
      alert('고객사를 선택하세요.');
      return;
    }
    onSave(formData as NCREntry);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'month' || name === 'day' || name === 'progressRate' ? Number(value) : value 
    }));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">부적합 사항 관리</h2>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form id="ncr-form" onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase">발생월</label><input name="month" type="number" value={formData.month} onChange={handleChange} className="w-full border p-2.5 rounded-xl text-sm" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase">발생일</label><input name="day" type="number" value={formData.day} onChange={handleChange} className="w-full border p-2.5 rounded-xl text-sm" /></div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">고객사</label>
              <input name="customer" list="customers" value={formData.customer} onChange={handleChange} className="w-full border p-2.5 rounded-xl text-sm font-bold" />
              <datalist id="customers">{CUSTOMER_LIST.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">모델 / 품명</label>
              <div className="grid grid-cols-2 gap-2">
                <input name="model" value={formData.model} onChange={handleChange} className="w-full border p-2.5 rounded-xl text-sm" placeholder="모델" />
                <input name="partName" value={formData.partName} onChange={handleChange} className="w-full border p-2.5 rounded-xl text-sm" placeholder="품명" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">불량 내용</label>
              <textarea name="defectContent" value={formData.defectContent} onChange={handleChange} rows={4} className="w-full border p-3 rounded-xl text-sm outline-none resize-none" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase">원인</label><textarea name="rootCause" value={formData.rootCause} onChange={handleChange} rows={2} className="w-full border p-3 rounded-xl text-sm" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase">대책</label><textarea name="countermeasure" value={formData.countermeasure} onChange={handleChange} rows={2} className="w-full border p-3 rounded-xl text-sm" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase">유효성점검</label><textarea name="validationCheck" value={formData.validationCheck} onChange={handleChange} rows={2} className="w-full border p-3 rounded-xl text-sm" placeholder="유효성 점검 결과를 입력하세요" /></div>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">첨부 파일 목록 (다중 가능)</p>
              <div className="space-y-2 mb-4">
                {formData.attachments?.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border text-xs">
                    <span className="truncate flex-1 font-medium">{file.name}</span>
                    <button type="button" onClick={() => removeAttachment(idx)} className="text-rose-500 font-bold ml-2">삭제</button>
                  </div>
                ))}
              </div>
              <input type="file" onChange={handleFileChange} className="text-xs w-full file:bg-blue-50 file:border-0 file:rounded-full file:px-4 file:py-1.5 file:text-blue-700 file:font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase">상태</label><select name="status" value={formData.status} onChange={handleChange} className="w-full border p-2.5 rounded-xl text-sm"><option value="Open">Open</option><option value="Closed">Closed</option></select></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase">진척률</label><input name="progressRate" type="number" value={formData.progressRate} onChange={handleChange} className="w-full border p-2.5 rounded-xl text-sm" /></div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-4">
          {initialData?.id && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('정말 삭제하시겠습니까?')) {
                  onDelete(initialData.id);
                }
              }}
              className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-black shadow-lg text-sm hover:bg-rose-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              삭제
            </button>
          )}
          <div className="flex gap-4 ml-auto">
            <button type="button" onClick={onCancel} className="px-8 py-2.5 border rounded-xl font-bold text-slate-500 text-sm">취소</button>
            <button form="ncr-form" type="submit" className="px-12 py-2.5 bg-blue-600 text-white rounded-xl font-black shadow-lg text-sm">데이터베이스 저장</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NCRForm;
