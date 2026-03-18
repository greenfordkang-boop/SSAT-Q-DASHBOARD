/**
 * UploaderModal — 품질관리 통합 업로더 모달
 * 6개 업로더를 2-column 레이아웃으로 표시
 * RPA(UiPath) 최적화: data-uploader 속성으로 셀렉터 타겟팅
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDataRefresh: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
interface UploaderState { status: UploadStatus; message: string; completedAt?: string; }

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 3 }, (_, i) => CURRENT_YEAR - 1 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);

// 유틸 함수
const safeNumber = (v: any): number => { const n = Number(v); return isNaN(n) ? 0 : n; };
const findCol = (row: any, ...names: string[]): any => {
  for (const name of names) { if (row[name] !== undefined) return row[name]; }
  const keys = Object.keys(row);
  for (const name of names) {
    const n = name.replace(/\[.*?\]/g, '').trim();
    for (const k of keys) { if (k.replace(/\[.*?\]/g, '').trim() === n) return row[k]; }
  }
  return undefined;
};
const getMonthEnd = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;
};

const STORAGE_KEY = 'uploader-states-quality';
const loadPersistedStates = (): Record<string, UploaderState> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const key of Object.keys(parsed)) {
        if (parsed[key].status === 'uploading') parsed[key] = { status: 'idle', message: '' };
      }
      return parsed;
    }
  } catch {}
  return {};
};
const formatTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const UploaderModal: React.FC<Props> = ({ isOpen, onClose, onDataRefresh }) => {
  const [states, setStates] = useState<Record<string, UploaderState>>(loadPersistedStates);
  const [targetYear, setTargetYear] = useState(CURRENT_YEAR);
  const [targetMonth, setTargetMonth] = useState(`${new Date().getMonth() + 1}월`);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const setRef = useCallback((id: string) => (el: HTMLInputElement | null) => { inputRefs.current[id] = el; }, []);
  const updateState = (id: string, state: UploaderState) => {
    const finalState = (state.status === 'success' || state.status === 'error')
      ? { ...state, completedAt: new Date().toISOString() }
      : state;
    setStates(prev => {
      const next = { ...prev, [id]: finalState };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const getState = (id: string): UploaderState => states[id] || { status: 'idle', message: '' };

  const getTargetMonthStr = () => {
    const m = parseInt(targetMonth);
    return `${targetYear}-${String(m).padStart(2, '0')}`;
  };

  // ── 공정품질 업로드 ──
  const uploadProcessQuality = async (file: File) => {
    const tm = getTargetMonthStr();
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(ws);
    if (jsonData.length === 0) throw new Error('데이터 없음');

    // 이전 업로드 데이터 삭제 (upload_id 기반 - 누적 엑셀의 월 범위 불일치 방지)
    const { data: oldUploads } = await supabase
      .from('process_quality_uploads')
      .select('id')
      .like('filename', `[${tm}]%`);
    if (oldUploads && oldUploads.length > 0) {
      const oldIds = oldUploads.map(u => u.id);
      await supabase.from('process_quality_data').delete().in('upload_id', oldIds);
      await supabase.from('process_quality_uploads').delete().in('id', oldIds);
    }
    const { data: rec, error: ue } = await supabase.from('process_quality_uploads').insert({ filename: `[${tm}] ${file.name}`, record_count: jsonData.length }).select().single();
    if (ue) throw ue;

    const rows = jsonData.map((row: any) => {
      const pq = safeNumber(findCol(row, '생산수량', '생산량') || 0);
      const dq = safeNumber(findCol(row, '불량수량', '불량량') || 0);
      return {
        upload_id: rec.id,
        customer: String(findCol(row, '고객사', '거래처') || ''),
        part_type: String(findCol(row, '공정', '공정구분', '부품유형') || ''),
        vehicle_model: findCol(row, '품종', '차종', '모델') || null,
        part_code: findCol(row, '품번', '부품코드', '부품번호', '자재번호', '관리번호', '제품코드', '자재코드', '품목코드', 'P/N', 'Part No', 'Part No.', 'Part Code', 'PartNo', 'PART NO', 'Item Code', 'Item No') || null,
        product_name: findCol(row, '품목명', '품명', '제품명') || null,
        production_qty: pq, defect_qty: dq,
        defect_amount: safeNumber(findCol(row, '불량금액', '금액') || 0),
        defect_rate: pq > 0 ? (dq / pq) * 100 : 0,
        data_date: findCol(row, '생산일자', '일자', '날짜') || `${tm}-15`
      };
    });
    const { error } = await supabase.from('process_quality_data').insert(rows);
    if (error) throw error;
    return jsonData.length;
  };

  // ── 불량유형 업로드 (공통 로직) ──
  const uploadDefectType = async (file: File, uploadTable: string, dataTable: string) => {
    const tm = getTargetMonthStr();
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const headers: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c })];
      headers.push(cell ? String(cell.v) : `Column${c + 1}`);
    }
    const jsonData = XLSX.utils.sheet_to_json(ws);
    if (jsonData.length === 0) throw new Error('데이터 없음');

    // 이전 업로드 데이터 삭제 (upload_id 기반 - 누적 엑셀의 월 범위 불일치 방지)
    const { data: oldUploads } = await supabase
      .from(uploadTable)
      .select('id')
      .like('filename', `[${tm}]%`);
    if (oldUploads && oldUploads.length > 0) {
      const oldIds = oldUploads.map(u => u.id);
      await supabase.from(dataTable).delete().in('upload_id', oldIds);
      await supabase.from(uploadTable).delete().in('id', oldIds);
    }
    const { data: rec, error: ue } = await supabase.from(uploadTable).insert({ filename: `[${tm}] ${file.name}`, record_count: jsonData.length }).select().single();
    if (ue) throw ue;

    const dtStart = 13, dtEnd = 32;
    const dtHeaders = headers.slice(dtStart, dtEnd + 1);

    const rows = jsonData.map((row: any) => {
      const defectTypes: Record<string, number> = {};
      dtHeaders.forEach(h => { const v = safeNumber(row[h]); if (v > 0) defectTypes[h] = v; });
      const pq = safeNumber(findCol(row, '생산수량', '생산량') || 0);
      const dq = safeNumber(findCol(row, '불량수량', '불량량', '총불량') || 0);
      return {
        upload_id: rec.id,
        customer: String(findCol(row, '고객사', '거래처') || ''),
        part_type: String(findCol(row, '공정', '공정구분', '부품유형') || ''),
        vehicle_model: findCol(row, '품종', '차종', '모델') || null,
        part_code: findCol(row, '품번', '부품코드', '부품번호', '자재번호', '관리번호', '제품코드', '자재코드', '품목코드', 'P/N', 'Part No', 'Part No.', 'Part Code', 'PartNo', 'PART NO', 'Item Code', 'Item No') || null,
        product_name: findCol(row, '품목명', '품명', '제품명') || null,
        production_qty: pq, defect_qty: dq,
        defect_rate: pq > 0 ? (dq / pq) * 100 : 0,
        defect_types: defectTypes,
        data_date: findCol(row, '생산일자', '일자', '날짜') || `${tm}-15`
      };
    });
    const { error } = await supabase.from(dataTable).insert(rows);
    if (error) throw error;
    return jsonData.length;
  };

  // ── 부품단가 업로드 ──
  const uploadPartsPrice = async (file: File) => {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(ws);
    if (jsonData.length === 0) throw new Error('데이터 없음');

    await supabase.from('parts_price_data').delete().neq('id', 0);
    const { data: rec, error: ue } = await supabase.from('parts_price_uploads').insert({ filename: file.name, record_count: jsonData.length }).select().single();
    if (ue) throw ue;

    const rows = jsonData.map((row: any) => ({
      upload_id: rec.id,
      part_code: String(findCol(row, '품번', '부품코드', '부품번호', '자재번호') || ''),
      part_name: String(findCol(row, '품목명', '품명', '제품명') || ''),
      unit_price: safeNumber(findCol(row, '단가', '매출단가', '판매단가') || 0),
      customer: findCol(row, '고객사', '거래처') || null,
      vehicle_model: findCol(row, '차종', '품종', '모델') || null
    }));
    const { error } = await supabase.from('parts_price_data').insert(rows);
    if (error) throw error;
    return jsonData.length;
  };

  // ── 통합 핸들러 ──
  type UploadHandler = (file: File) => Promise<number>;
  const handlers: Record<string, UploadHandler> = {
    'process-quality': uploadProcessQuality,
    'process-defect': (f) => uploadDefectType(f, 'process_defect_type_uploads', 'process_defect_type_data'),
    'painting-defect': (f) => uploadDefectType(f, 'painting_defect_type_uploads', 'painting_defect_type_data'),
    'assembly-defect': (f) => uploadDefectType(f, 'assembly_defect_type_uploads', 'assembly_defect_type_data'),
    'parts-price': uploadPartsPrice,
  };

  const handleUpload = async (id: string, file: File) => {
    updateState(id, { status: 'uploading', message: '처리중...' });
    try {
      const handler = handlers[id];
      if (!handler) throw new Error('알 수 없는 업로드 유형');
      const count = await handler(file);
      onDataRefresh();
      updateState(id, { status: 'success', message: `${count.toLocaleString()}건 완료` });
    } catch (e: any) {
      updateState(id, { status: 'error', message: e.message || '오류' });
    }
  };

  const triggerInput = (id: string) => inputRefs.current[id]?.click();
  const onFileChange = (id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(id, file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  const accept = '.csv,.xlsx,.xls';

  const StatusBadge = ({ id }: { id: string }) => {
    const s = getState(id);
    if (s.status === 'idle') return null;
    if (s.status === 'uploading') return (
      <span className="flex items-center gap-1 text-blue-600 text-[11px]" data-upload-status="uploading">
        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" /></svg>
        처리중
      </span>
    );
    if (s.status === 'success') return (
      <span className="flex items-center gap-1 text-emerald-600 text-[11px] font-medium" data-upload-status="success">
        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        {s.message}
        {s.completedAt && <span className="text-gray-400 font-normal ml-0.5">{formatTime(s.completedAt)}</span>}
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-rose-500 text-[11px] font-medium" data-upload-status="error" title={s.message}>
        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        {s.message}
        {s.completedAt && <span className="text-rose-300 font-normal ml-0.5">{formatTime(s.completedAt)}</span>}
      </span>
    );
  };

  const FileBtn = ({ id }: { id: string }) => (
    <button onClick={() => triggerInput(id)} className="h-6 px-2.5 text-[11px] font-semibold bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors whitespace-nowrap" data-uploader={id}>파일선택</button>
  );

  const SelectYear = ({ testId }: { testId: string }) => (
    <select value={targetYear} onChange={e => setTargetYear(Number(e.target.value))} className="h-6 text-[11px] bg-slate-100 border border-slate-300 rounded px-1 appearance-none cursor-pointer" data-uploader-param={testId}>
      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
    </select>
  );
  const SelectMonth = ({ testId }: { testId: string }) => (
    <select value={targetMonth} onChange={e => setTargetMonth(e.target.value)} className="h-6 text-[11px] bg-slate-100 border border-slate-300 rounded px-1 appearance-none cursor-pointer" data-uploader-param={testId}>
      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
    </select>
  );

  const Row = ({ id, label, hasMonth }: { id: string; label: string; hasMonth?: boolean }) => (
    <div className="flex items-center h-7 gap-2" data-uploader-row={id}>
      <span className="text-[12px] font-medium text-slate-700 w-[90px] shrink-0 truncate" title={label}>{label}</span>
      {hasMonth && <><SelectYear testId={`${id}-year`} /><SelectMonth testId={`${id}-month`} /></>}
      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-700">XLS/CSV</span>
      <span className="ml-auto shrink-0"><FileBtn id={id} /></span>
      <input ref={setRef(id)} type="file" accept={accept} className="hidden" onChange={onFileChange(id)} data-uploader-input={id} />
      <span className="flex-1 min-w-0 truncate text-right"><StatusBadge id={id} /></span>
    </div>
  );

  const Section = ({ color, label, children }: { color: string; label: string; children: React.ReactNode }) => (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-[680px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-base font-bold text-slate-800">데이터 업로더</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors text-lg font-bold">&times;</button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-2 gap-x-6 px-5 py-4">
          {/* 왼쪽: 공정품질 */}
          <div className="space-y-3">
            <Section color="bg-emerald-500" label="공정품질">
              <Row id="process-quality" label="공정불량" hasMonth />
            </Section>

            <Section color="bg-rose-500" label="불량유형분석">
              <Row id="process-defect" label="사출불량유형" hasMonth />
              <Row id="painting-defect" label="도장불량유형" hasMonth />
              <Row id="assembly-defect" label="조립불량유형" hasMonth />
            </Section>
          </div>

          {/* 오른쪽: 기준정보 */}
          <div className="space-y-3">
            <Section color="bg-amber-500" label="기준정보">
              <Row id="parts-price" label="부품단가" />
            </Section>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400">
          파일 선택 시 자동으로 파싱 및 저장됩니다 &middot; RPA: <code className="bg-slate-200 px-1 rounded">data-uploader</code> 속성 사용
        </div>
      </div>
    </div>
  );
};

export default UploaderModal;
