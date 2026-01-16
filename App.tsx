
import React, { useState, useEffect } from 'react';
import { NCREntry, DashboardTab, CustomerMetric, IncomingMetric } from './types';
import Dashboard from './components/Dashboard';
import NCRTable from './components/NCRTable';
import NCRForm from './components/NCRForm';
import EightDReportModal from './components/EightDReportModal';
import CustomerQuality from './components/CustomerQuality';
import IncomingQuality from './components/IncomingQuality';
import ProcessQuality from './components/ProcessQuality';
import OutgoingQuality from './components/OutgoingQuality';
import { 
  supabase, 
  saveSupabaseConfig, 
  resetSupabaseConfig,
  STORAGE_KEY_URL, 
  STORAGE_KEY_KEY 
} from './lib/supabaseClient';

const TABS: DashboardTab[] = [
  { id: 'overall', label: '종합현황' },
  { id: 'ncr', label: 'NCR' },
  { id: 'customer', label: '고객품질' },
  { id: 'incoming', label: '수입검사' },
  { id: 'process', label: '공정품질' },
  { id: 'outgoing', label: '출하품질' },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  const [ncrData, setNcrData] = useState<NCREntry[]>([]);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetric[]>([]);
  const [incomingMetrics, setIncomingMetrics] = useState<IncomingMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab['id']>('overall');
  const [showForm, setShowForm] = useState(false);
  const [showEightD, setShowEightD] = useState(false);
  const [editingEntry, setEditingEntry] = useState<NCREntry | null>(null);
  const [selectedFor8D, setSelectedFor8D] = useState<NCREntry | null>(null);

  // Config Error State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configUrl, setConfigUrl] = useState('');
  const [configKey, setConfigKey] = useState('');

  useEffect(() => {
    // lib/supabaseClient.ts와 동일한 키 상수를 사용하여 불일치 방지
    const storedUrl = localStorage.getItem(STORAGE_KEY_URL);
    const storedKey = localStorage.getItem(STORAGE_KEY_KEY);
    
    if (storedUrl) setConfigUrl(storedUrl);
    if (storedKey) setConfigKey(storedKey);

    const authStatus = sessionStorage.getItem('isAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchAllData();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'SSAT2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('isAuth', 'true');
      fetchAllData();
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      setIsAuthenticated(false);
      sessionStorage.removeItem('isAuth');
      setPassword('');
    }
  };

  const handleConfigSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configUrl || !configKey) {
      alert('URL과 API Key를 모두 입력해주세요.');
      return;
    }
    // 기본 검증 후 supabaseClient의 저장 함수 호출 (여기서 reload 발생)
    saveSupabaseConfig(configUrl, configKey);
  };

  const handleError = (error: any, context: string) => {
    // 1. Detailed Logging for Debugging
    if (typeof error === 'object' && error !== null) {
        console.error(`${context} Error (Raw):`, error);
        try {
            console.error(`${context} Error (JSON):`, JSON.stringify(error, null, 2));
        } catch (e) {
            console.error(`${context} Error (Stringified):`, String(error));
        }
    } else {
        console.error(`${context} Error:`, error);
    }
    
    let msg = '알 수 없는 오류가 발생했습니다.';

    // 2. Smart Message Extraction
    if (typeof error === 'string') {
        msg = error;
    } else if (error instanceof Error) {
        msg = error.message;
    } else if (typeof error === 'object' && error !== null) {
        // Supabase / Postgrest Standard Error
        if ('message' in error) {
            msg = String(error.message);
            if (error.details) msg += `\n(상세: ${error.details})`;
            if (error.hint) msg += `\n(힌트: ${error.hint})`;
            if (error.code) msg += `\n(코드: ${error.code})`;
        }
        // Auth Error
        else if ('error_description' in error) {
            msg = String(error.error_description);
        }
        // Fetch/Network Response object
        else if ('statusText' in error) {
            msg = `HTTP Error: ${error.statusText}`;
        }
        // Fallback for generic objects
        else {
             try {
                const json = JSON.stringify(error);
                if (json !== '{}') {
                    msg = json.length > 200 ? json.substring(0, 200) + '...' : json;
                } else {
                    // Empty JSON usually means a native Event object (Network error etc)
                    msg = '네트워크 연결 오류 또는 서버 응답이 없습니다.';
                }
             } catch {
                msg = String(error);
             }
        }
    }

    const lowerMsg = msg.toLowerCase();

    // 3. Actionable Checks
    // Auth / API Key
    if (
        lowerMsg.includes('invalid api key') || 
        lowerMsg.includes('jwt') || 
        lowerMsg.includes('apikey') || 
        lowerMsg.includes('service_role')
    ) {
      setShowConfigModal(true);
      return; // Don't alert if we show the modal
    }

    // HTML Response (SPA/404 issues)
    if (lowerMsg.includes('<!doctype') || lowerMsg.includes('<html')) {
        msg = '서버 URL 설정이 올바르지 않습니다. (HTML 응답 반환됨)';
        setShowConfigModal(true);
    }
    
    // Missing Tables
    if (lowerMsg.includes('relation') && lowerMsg.includes('does not exist')) {
        msg = `테이블을 찾을 수 없습니다. Supabase SQL Editor에서 테이블 생성 쿼리를 실행했는지 확인해주세요.\n\n${msg}`;
    }

    alert(`${context} 실패:\n${msg}`);
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 1. NCR 데이터 가져오기
      const { data: ncrEntries, error: ncrError } = await supabase
        .from('ncr_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (ncrError) {
         handleError(ncrError, "데이터 조회(NCR)");
         if (ncrError.message?.includes('Invalid API key') || ncrError.code === 'PGRST301') {
           setIsLoading(false);
           return;
         }
      }
      
      setNcrData((ncrEntries || []).map((e: any) => ({
        id: e.id, month: e.month, day: e.day, source: e.source, customer: e.customer,
        model: e.model, partName: e.part_name, partNo: e.part_no, defectContent: e.defect_content,
        outflowCause: e.outflow_cause, rootCause: e.root_cause, countermeasure: e.countermeasure,
        planDate: e.plan_date, resultDate: e.result_date, effectivenessCheck: e.effectiveness_check,
        status: e.status, progressRate: e.progress_rate, remarks: e.remarks,
        attachments: e.attachments || [], eightDData: e.eight_d_data
      })));

      // 2. 고객 품질 실적 가져오기
      const { data: cMetrics, error: cError } = await supabase
        .from('customer_metrics')
        .select('*')
        .order('month', { ascending: true });
      
      if (cError) console.warn("Metrics Fetch Warning:", cError);
      
      setCustomerMetrics((cMetrics || []).map((m: any) => ({
        id: m.id,
        year: Number(m.year),
        customer: m.customer,
        month: Number(m.month),
        target: Number(m.target),
        inspectionQty: Number(m.inspection_qty || 0),
        defects: Number(m.defects || 0),
        actual: Number(m.actual || 0)
      })));

      // 3. 수입 검사(협력업체) 실적 가져오기
      const { data: iMetrics, error: iError } = await supabase
        .from('incoming_metrics')
        .select('*')
        .order('month', { ascending: true });

      if (iError) console.warn("Incoming Metrics Fetch Warning:", iError);

      setIncomingMetrics((iMetrics || []).map((m: any) => ({
        id: m.id,
        year: Number(m.year),
        month: Number(m.month),
        supplier: m.supplier,
        incomingQty: Number(m.incoming_qty || 0),
        defectQty: Number(m.defect_qty || 0),
        ppm: Number(m.ppm || 0)
      })));

    } catch (e: any) {
      console.error("Critical Data Fetch Error:", e);
      handleError(e, "데이터 초기화");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCustomerMetrics = async (payload: CustomerMetric | CustomerMetric[]) => {
    try {
      const metricsArray = Array.isArray(payload) ? payload : [payload];
      const dbPayload = metricsArray.map(m => ({
        year: m.year,
        month: m.month,
        customer: m.customer,
        target: m.target,
        inspection_qty: m.inspectionQty,
        defects: m.defects,
        actual: m.actual
      }));

      const { error } = await supabase.from('customer_metrics').upsert(dbPayload, { onConflict: 'customer,year,month' });
      if (error) throw error;
      await fetchAllData();
      return true;
    } catch (e: any) {
      handleError(e, "지표 저장");
      return false;
    }
  };

  const handleSaveIncomingMetrics = async (payload: IncomingMetric) => {
    try {
      // 1. DB에 저장할 객체 생성
      const dbPayload: any = {
        year: payload.year,
        month: payload.month,
        supplier: payload.supplier,
        incoming_qty: payload.incomingQty,
        defect_qty: payload.defectQty,
        ppm: payload.ppm
      };

      let error = null;

      // 2. 로직: ID가 있으면 Update, 없으면 조회 후 Update/Insert (유니크 제약 조건 미설정 대비)
      if (payload.id) {
         // 수정 모드: ID로 직접 업데이트
         const { error: updateError } = await supabase
           .from('incoming_metrics')
           .update(dbPayload)
           .eq('id', payload.id);
         error = updateError;
      } else {
         // 신규 등록 모드: 중복 데이터 확인
         const { data: existing } = await supabase
           .from('incoming_metrics')
           .select('id')
           .eq('year', payload.year)
           .eq('month', payload.month)
           .eq('supplier', payload.supplier)
           .maybeSingle();
         
         if (existing?.id) {
           // 이미 존재하면 업데이트
           const { error: updateError } = await supabase
             .from('incoming_metrics')
             .update(dbPayload)
             .eq('id', existing.id);
           error = updateError;
         } else {
           // 없으면 새로 추가
           const { error: insertError } = await supabase
             .from('incoming_metrics')
             .insert(dbPayload);
           error = insertError;
         }
      }

      if (error) throw error;
      await fetchAllData();
      return true;
    } catch (e: any) {
      handleError(e, "수입검사 실적 저장");
      return false;
    }
  };

  const handleSaveNCR = async (entry: NCREntry) => {
    try {
      const dbPayload = {
        ...(entry.id ? { id: entry.id } : {}),
        month: entry.month, day: entry.day, source: entry.source, customer: entry.customer,
        model: entry.model, part_name: entry.partName, part_no: entry.partNo,
        defect_content: entry.defectContent, root_cause: entry.rootCause, countermeasure: entry.countermeasure,
        plan_date: entry.planDate, result_date: entry.resultDate,
        status: entry.status, progress_rate: entry.progressRate,
        attachments: entry.attachments || [], eight_d_data: entry.eightDData
      };
      
      const { error } = await supabase.from('ncr_entries').upsert(dbPayload);
      if (error) throw error;
      await fetchAllData();
      setShowForm(false);
    } catch (e: any) { 
      handleError(e, "NCR 저장");
    }
  };

  const handleSave8D = async (id: string, updatedFields: Partial<NCREntry>) => {
    try {
      const existing = ncrData.find(e => e.id === id);
      if (!existing) return;
      const merged = { ...existing, ...updatedFields };
      
      const dbPayload = {
        id: merged.id,
        month: merged.month, day: merged.day, source: merged.source, customer: merged.customer,
        model: merged.model, part_name: merged.partName, part_no: merged.partNo,
        defect_content: merged.defectContent, root_cause: merged.rootCause, countermeasure: merged.countermeasure,
        plan_date: merged.planDate, result_date: merged.resultDate,
        status: merged.status, progress_rate: merged.progressRate,
        attachments: merged.attachments || [], eight_d_data: merged.eightDData
      };

      const { error } = await supabase.from('ncr_entries').upsert(dbPayload);
      if (error) throw error;
      await fetchAllData();
    } catch (e: any) { 
      handleError(e, "8D Report 저장");
    }
  };

  const handleDeleteNCR = async (id: string) => {
    if (!id || !window.confirm('삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('ncr_entries').delete().eq('id', id);
      if (error) throw error;
      fetchAllData();
    } catch (e: any) {
      handleError(e, "삭제");
    }
  };

  // DB 설정 모달
  if (showConfigModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1128] text-white p-6">
        <div className="w-full max-w-lg bg-slate-900 p-8 rounded-3xl border border-rose-500/50 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-block p-3 bg-rose-500/20 rounded-full mb-4">
              <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-2xl font-black mb-2">Supabase 연결 오류</h2>
            <p className="text-slate-400 text-sm mb-4">
              API Key가 유효하지 않거나 연결이 거부되었습니다.<br/>
              <strong>Project URL</strong>과 <strong>Anon Public Key</strong>를 확인해주세요.
            </p>
            <div className="bg-slate-800 p-3 rounded-lg text-xs text-left text-slate-300 font-mono break-all mb-4">
               Default URL: https://xjjsqyawvojybuyrehrr.supabase.co<br/>
               Current Key Hint: {configKey ? configKey.substring(0, 10) + '...' : 'Not Set'}
            </div>
          </div>
          <form onSubmit={handleConfigSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Project URL</label>
              <input 
                type="text" 
                value={configUrl} 
                onChange={e => setConfigUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-sm font-mono text-blue-400 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Anon / Public API Key</label>
              <input 
                type="text" 
                value={configKey} 
                onChange={e => setConfigKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-sm font-mono text-emerald-400 focus:border-emerald-500 outline-none break-all"
              />
              <p className="text-[10px] text-slate-500 mt-1">* <code>sb_publishable_...</code> 키가 작동하지 않을 경우 <code>anon</code> JWT 키를 사용하세요.</p>
            </div>
            <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 py-3 rounded-xl font-bold transition-all shadow-lg mt-4">
              설정 저장 및 다시 시도
            </button>
            <button type="button" onClick={resetSupabaseConfig} className="w-full py-2 text-slate-500 text-xs hover:text-slate-300">
              초기 설정으로 복원
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1128] text-white p-6">
        <div className="w-full max-w-md bg-slate-900/50 p-10 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black mb-2 tracking-tight">품질관리현황 시스템</h1>
            <p className="text-slate-500 text-sm">Access Password Required</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full bg-black/40 border ${loginError ? 'border-rose-500 animate-shake' : 'border-slate-700'} rounded-2xl p-4 text-center text-xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black transition-all shadow-lg active:scale-[0.98]">접속</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9] overflow-x-hidden font-['Noto_Sans_KR']">
      <nav className="bg-[#0a1128] text-white px-6 py-2 flex items-center justify-between sticky top-0 z-[100] border-b border-slate-800">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
            <h1 className="text-lg font-black tracking-tight border-r border-slate-700 pr-4 mr-2">품질관리현황</h1>
          </div>
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button 
                key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg></button>
      </nav>

      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'overall' && <Dashboard data={ncrData} />}
            {activeTab === 'ncr' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-black text-slate-800">부적합(NCR) 내역 관리</h2>
                  <button onClick={() => { setEditingEntry(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg">신규 부적합 등록</button>
                </div>
                <NCRTable data={ncrData} onEdit={(e) => { setEditingEntry(e); setShowForm(true); }} onDelete={handleDeleteNCR} onOpen8D={(e) => { setSelectedFor8D(e); setShowEightD(true); }} />
              </div>
            )}
            {activeTab === 'customer' && <CustomerQuality metrics={customerMetrics} onSaveMetric={handleSaveCustomerMetrics} />}
            {activeTab === 'incoming' && <IncomingQuality metrics={incomingMetrics} onSave={handleSaveIncomingMetrics} />}
            {activeTab === 'process' && <ProcessQuality />}
            {activeTab === 'outgoing' && <OutgoingQuality />}
          </div>
        )}
      </main>

      {showForm && <NCRForm initialData={editingEntry} onSave={handleSaveNCR} onDelete={handleDeleteNCR} onCancel={() => setShowForm(false)} />}
      {showEightD && selectedFor8D && <EightDReportModal entry={selectedFor8D} onSave={handleSave8D} onClose={() => setShowEightD(false)} />}
    </div>
  );
};

export default App;
