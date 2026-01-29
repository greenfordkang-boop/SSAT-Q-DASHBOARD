
import React, { useState, useEffect } from 'react';
import { NCREntry, DashboardTab, CustomerMetric, SupplierMetric, OutgoingMetric, QuickResponseEntry, ProcessQualityData, ProcessQualityUpload, ProcessDefectTypeData, ProcessDefectTypeUpload, PaintingDefectTypeData, PaintingDefectTypeUpload, AssemblyDefectTypeData, AssemblyDefectTypeUpload } from './types';
import Dashboard from './components/Dashboard';
import NCRTable from './components/NCRTable';
import NCRForm from './components/NCRForm';
import EightDReportModal from './components/EightDReportModal';
import CustomerQuality from './components/CustomerQuality';
import IncomingQuality from './components/IncomingQuality';
import ProcessQuality from './components/ProcessQuality';
import OutgoingQuality from './components/OutgoingQuality';
import QuickResponse from './components/QuickResponse';
import DatabaseSetupScreen from './components/DatabaseSetupScreen';
import { supabase, saveSupabaseConfig, resetSupabaseConfig } from './lib/supabaseClient';
import { checkTableExists } from './lib/dbMigration';
import * as XLSX from 'xlsx';

const TABS: DashboardTab[] = [
  { id: 'overall', label: '종합현황' },
  { id: 'ncr', label: 'NCR' },
  { id: 'customer', label: '고객품질' },
  { id: 'incoming', label: '수입검사' },
  { id: 'process', label: '공정품질' },
  { id: 'outgoing', label: '출하품질' },
  { id: 'quickresponse', label: '신속대응' },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  const [ncrData, setNcrData] = useState<NCREntry[]>([]);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetric[]>([]);
  const [supplierMetrics, setSupplierMetrics] = useState<SupplierMetric[]>([]);
  const [outgoingMetrics, setOutgoingMetrics] = useState<OutgoingMetric[]>([]);
  const [quickResponseData, setQuickResponseData] = useState<QuickResponseEntry[]>([]);
  const [processQualityData, setProcessQualityData] = useState<ProcessQualityData[]>([]);
  const [processQualityUploads, setProcessQualityUploads] = useState<ProcessQualityUpload[]>([]);
  const [processDefectTypeData, setProcessDefectTypeData] = useState<ProcessDefectTypeData[]>([]);
  const [processDefectTypeUploads, setProcessDefectTypeUploads] = useState<ProcessDefectTypeUpload[]>([]);
  const [paintingDefectTypeData, setPaintingDefectTypeData] = useState<PaintingDefectTypeData[]>([]);
  const [paintingDefectTypeUploads, setPaintingDefectTypeUploads] = useState<PaintingDefectTypeUpload[]>([]);
  const [assemblyDefectTypeData, setAssemblyDefectTypeData] = useState<AssemblyDefectTypeData[]>([]);
  const [assemblyDefectTypeUploads, setAssemblyDefectTypeUploads] = useState<AssemblyDefectTypeUpload[]>([]);
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

  // Database Setup State
  const [needsDatabaseSetup, setNeedsDatabaseSetup] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');

  useEffect(() => {
    // 로컬 스토리지에서 현재 설정값을 가져와 모달 초기값으로 설정
    const storedUrl = localStorage.getItem('supabase_url_v5'); // v5 key check
    const storedKey = localStorage.getItem('supabase_key_v5');
    if (storedUrl) {
      setConfigUrl(storedUrl);
      setSupabaseUrl(storedUrl);
    } else {
      // 기본 URL 사용
      setSupabaseUrl('https://xjjsqyawvojybuyrehrr.supabase.co');
    }
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
    if (!configUrl.trim().startsWith('https://')) {
        alert('URL은 https:// 로 시작해야 합니다.');
        return;
    }
    saveSupabaseConfig(configUrl, configKey);
  };

  const handleError = (error: any, context: string) => {
    console.error(`${context} Error Object:`, error);
    
    // API Key Error Check
    if (
      error?.message?.includes('Invalid API key') || 
      error?.code === 'PGRST301' || 
      error?.hint?.includes('API key')
    ) {
      setShowConfigModal(true);
      return;
    }

    // Updated_at Column Missing Error Check (🚨 고객품질 저장 오류)
    if (error?.message?.includes('updated_at') &&
        (error?.message?.includes('has no field') || error?.message?.includes('column'))) {
      alert(`🚨 데이터베이스 설정 오류: updated_at 컬럼이 누락되었습니다.\n\n해결 방법:\n1. 프로젝트 폴더에서 "CRITICAL-FIX-updated-at.sql" 파일 열기\n2. 내용 전체 복사\n3. Supabase SQL Editor에 붙여넣기 후 실행\n4. "모든 수정이 완료되었습니다" 메시지 확인\n5. 이 페이지를 새로고침하고 다시 시도\n\n자세한 안내: FIX-INSTRUCTIONS.md 파일 참조\n\n에러: ${error.message}`);
      return;
    }

    // Table Not Found Error Check
    if (error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
      alert(`오류: 데이터베이스 테이블을 찾을 수 없습니다.\n\nSupabase SQL Editor에서 테이블 생성 스크립트를 실행했는지 확인해주세요.\n(${error.message})`);
      return;
    }

    // Advanced Error Message Extraction
    let msg = '알 수 없는 오류';
    
    if (typeof error === 'string') {
        msg = error;
    } else if (error && typeof error === 'object') {
        if (error.message) {
            msg = error.message;
            if (error.details) msg += ` (${error.details})`;
            else if (error.hint) msg += ` (${error.hint})`;
        }
        else if (error.error_description) msg = error.error_description;
        else if (error.statusText) msg = error.statusText;
        else {
            try {
                const json = JSON.stringify(error);
                if (json !== '{}') {
                    msg = json;
                } else {
                    if (error.constructor && error.constructor.name !== 'Object') {
                         msg = `Error Type: ${error.constructor.name}`;
                    } else {
                         msg = String(error);
                    }
                }
            } catch {
                msg = String(error);
            }
        }
    }

    // 404 HTML Page Response Check (잘못된 URL로 인해 HTML 에러 페이지가 반환되는 경우)
    if (typeof msg === 'string' && (msg.includes('<!DOCTYPE html') || msg.includes('<html'))) {
        msg = 'Supabase URL이 올바르지 않거나 연결할 수 없습니다. (404 Not Found)';
        setShowConfigModal(true);
    }

    // Prevent [object Object] in alert
    if (msg === '[object Object]') {
        msg = '상세 내용을 확인할 수 없는 오류입니다. 콘솔을 확인해주세요.';
    }
    
    alert(`${context} 실패: ${msg}`);
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 0. 데이터베이스 테이블 존재 여부 확인 (공정품질 테이블)
      const processQualityTableExists = await checkTableExists(supabase, 'process_quality_uploads');
      if (!processQualityTableExists) {
        console.warn('⚠️ 공정품질 테이블이 존재하지 않습니다. 데이터베이스 설정이 필요합니다.');
        setNeedsDatabaseSetup(true);
        setIsLoading(false);
        return;
      }

      // 1. NCR 데이터 가져오기
      const { data: ncrEntries, error: ncrError } = await supabase
        .from('ncr_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (ncrError) {
         handleError(ncrError, "데이터 조회(NCR)");
         if (ncrError.message?.includes('Invalid API key')) {
           setIsLoading(false);
           return;
         }
      }
      
      setNcrData((ncrEntries || []).map((e: any) => ({
        id: e.id, month: e.month, day: e.day, source: e.source, customer: e.customer,
        model: e.model, partName: e.part_name, partNo: e.part_no, defectContent: e.defect_content,
        outflowCause: e.outflow_cause, rootCause: e.root_cause, countermeasure: e.countermeasure,
        planDate: e.plan_date, resultDate: e.result_date, effectivenessCheck: e.effectiveness_check,
        validationCheck: e.validation_check || '',
        status: e.status, progressRate: e.progress_rate, remarks: e.remarks,
        attachments: e.attachments || [], eightDData: e.eight_d_data
      })));

      // 2. 고객 품질 실적 가져오기
      const { data: cMetrics, error: cError } = await supabase
        .from('customer_metrics')
        .select('*')
        .order('month', { ascending: true });
      
      if (cError) {
         // 테이블 없음 에러는 무시하지 않고 경고 (하지만 앱은 계속 실행)
         console.warn("Metrics Fetch Warning:", cError.message);
      }
      
      const typedMetrics = (cMetrics || []).map((m: any) => ({
        id: m.id,
        year: Number(m.year),
        customer: m.customer,
        month: Number(m.month),
        target: Number(m.target),
        inspectionQty: Number(m.inspection_qty || 0),
        defects: Number(m.defects || 0),
        actual: Number(m.actual || 0)
      }));
      setCustomerMetrics(typedMetrics);

      // 3. 협력업체 품질 실적 가져오기
      const { data: sMetrics, error: sError } = await supabase
        .from('supplier_metrics')
        .select('*')
        .order('month', { ascending: true });

      if (sError) {
         console.warn("Supplier Metrics Fetch Warning:", sError.message);
      }

      const typedSupplierMetrics = (sMetrics || []).map((m: any) => ({
        id: m.id,
        year: Number(m.year),
        supplier: m.supplier,
        month: Number(m.month),
        target: Number(m.target),
        incomingQty: Number(m.incoming_qty || 0),
        inspectionQty: Number(m.inspection_qty || 0),
        defects: Number(m.defects || 0),
        actual: Number(m.actual || 0)
      }));
      setSupplierMetrics(typedSupplierMetrics);

      // 4. 출하 품질 실적 가져오기
      const { data: oMetrics, error: oError } = await supabase
        .from('outgoing_metrics')
        .select('*')
        .order('month', { ascending: true });

      if (oError) {
        console.warn("Outgoing Metrics Fetch Warning:", oError.message);
      }

      const typedOutgoingMetrics = (oMetrics || []).map((m: any) => ({
        id: m.id,
        year: Number(m.year),
        month: Number(m.month),
        target: Number(m.target),
        inspectionQty: Number(m.inspection_qty || 0),
        defects: Number(m.defects || 0),
        actual: Number(m.actual || 0)
      }));
      setOutgoingMetrics(typedOutgoingMetrics);

      // 5. 신속대응 추적 데이터 가져오기
      const { data: qrData, error: qrError } = await supabase
        .from('quick_response_entries')
        .select('*')
        .order('date', { ascending: false });

      if (qrError) {
        console.warn("Quick Response Fetch Warning:", qrError.message);
      }

      const typedQuickResponseData = (qrData || []).map((q: any) => ({
        id: q.id,
        date: q.date,
        department: q.department,
        machineNo: q.machine_no || '',
        defectCount: Number(q.defect_count || 0),
        model: q.model,
        defectType: q.defect_type || '',
        process: q.process || '',
        defectContent: q.defect_content || '',
        coating: q.coating || '',
        area: q.area || '',
        materialCode: q.material_code || '',
        shielding: q.shielding || '',
        action: q.action || '',
        materialManager: q.material_manager || '',
        meetingAttendance: q.meeting_attendance || '',
        status24H: q.status_24h || 'N/A',
        status3D: q.status_3d || 'N/A',
        status14DAY: q.status_14day || 'N/A',
        status24D: q.status_24d || 'N/A',
        status25D: q.status_25d || 'N/A',
        status30D: q.status_30d || 'N/A',
        customerMM: q.customer_mm || '',
        remarks: q.remarks || ''
      }));
      setQuickResponseData(typedQuickResponseData);

      // 6. 공정불량 데이터 가져오기
      const { data: pqData, error: pqError } = await supabase
        .from('process_quality_data')
        .select('*')
        .order('data_date', { ascending: false });

      if (pqError) {
        console.warn("Process Quality Data Fetch Warning:", pqError.message);
      }

      const typedProcessQualityData = (pqData || []).map((p: any) => ({
        id: p.id,
        uploadId: p.upload_id,
        customer: p.customer,
        partType: p.part_type,
        vehicleModel: p.vehicle_model,
        productName: p.product_name,
        productionQty: Number(p.production_qty || 0),
        defectQty: Number(p.defect_qty || 0),
        defectAmount: Number(p.defect_amount || 0),
        defectRate: Number(p.defect_rate || 0),
        dataDate: p.data_date,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
      setProcessQualityData(typedProcessQualityData);

      // 7. 공정불량 업로드 이력 가져오기
      const { data: pqUploads, error: pqUploadError } = await supabase
        .from('process_quality_uploads')
        .select('*')
        .order('upload_date', { ascending: false });

      if (pqUploadError) {
        console.warn("Process Quality Upload Fetch Warning:", pqUploadError.message);
      }

      const typedProcessQualityUploads = (pqUploads || []).map((u: any) => ({
        id: u.id,
        filename: u.filename,
        recordCount: Number(u.record_count || 0),
        uploadDate: u.upload_date,
        createdAt: u.created_at
      }));
      setProcessQualityUploads(typedProcessQualityUploads);

      // 8. 공정불량유형 데이터 가져오기
      const { data: pdtData, error: pdtError } = await supabase
        .from('process_defect_type_data')
        .select('*')
        .order('data_date', { ascending: false });

      if (pdtError) {
        console.warn("Process Defect Type Data Fetch Warning:", pdtError.message);
      }

      const typedProcessDefectTypeData = (pdtData || []).map((p: any) => ({
        id: p.id,
        uploadId: p.upload_id,
        customer: p.customer,
        partCode: p.part_code,
        partName: p.part_name,
        process: p.process,
        vehicleModel: p.vehicle_model,
        defectType1: Number(p.defect_type_1 || 0),
        defectType2: Number(p.defect_type_2 || 0),
        defectType3: Number(p.defect_type_3 || 0),
        defectType4: Number(p.defect_type_4 || 0),
        defectType5: Number(p.defect_type_5 || 0),
        defectType6: Number(p.defect_type_6 || 0),
        defectType7: Number(p.defect_type_7 || 0),
        defectType8: Number(p.defect_type_8 || 0),
        defectType9: Number(p.defect_type_9 || 0),
        defectType10: Number(p.defect_type_10 || 0),
        defectTypesDetail: p.defect_types_detail || {},
        totalDefects: Number(p.total_defects || 0),
        dataDate: p.data_date,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
      setProcessDefectTypeData(typedProcessDefectTypeData);

      // 9. 공정불량유형 업로드 이력 가져오기
      const { data: pdtUploads, error: pdtUploadError } = await supabase
        .from('process_defect_type_uploads')
        .select('*')
        .order('upload_date', { ascending: false });

      if (pdtUploadError) {
        console.warn("Process Defect Type Upload Fetch Warning:", pdtUploadError.message);
      }

      const typedProcessDefectTypeUploads = (pdtUploads || []).map((u: any) => ({
        id: u.id,
        filename: u.filename,
        recordCount: Number(u.record_count || 0),
        uploadDate: u.upload_date,
        createdAt: u.created_at
      }));
      setProcessDefectTypeUploads(typedProcessDefectTypeUploads);

      // 10. 도장불량유형 데이터 가져오기
      const { data: paintingData, error: paintingError } = await supabase
        .from('painting_defect_type_data')
        .select('*')
        .order('data_date', { ascending: false });

      if (paintingError) {
        console.warn("Painting Defect Type Data Fetch Warning:", paintingError.message);
      }

      const typedPaintingDefectTypeData = (paintingData || []).map((p: any) => ({
        id: p.id,
        uploadId: p.upload_id,
        customer: p.customer,
        partCode: p.part_code,
        partName: p.part_name,
        process: p.process,
        vehicleModel: p.vehicle_model,
        defectType1: Number(p.defect_type_1 || 0),
        defectType2: Number(p.defect_type_2 || 0),
        defectType3: Number(p.defect_type_3 || 0),
        defectType4: Number(p.defect_type_4 || 0),
        defectType5: Number(p.defect_type_5 || 0),
        defectType6: Number(p.defect_type_6 || 0),
        defectType7: Number(p.defect_type_7 || 0),
        defectType8: Number(p.defect_type_8 || 0),
        defectType9: Number(p.defect_type_9 || 0),
        defectType10: Number(p.defect_type_10 || 0),
        defectTypesDetail: p.defect_types_detail || {},
        totalDefects: Number(p.total_defects || 0),
        dataDate: p.data_date,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
      setPaintingDefectTypeData(typedPaintingDefectTypeData);

      // 11. 도장불량유형 업로드 이력 가져오기
      const { data: paintingUploads, error: paintingUploadError } = await supabase
        .from('painting_defect_type_uploads')
        .select('*')
        .order('upload_date', { ascending: false });

      if (paintingUploadError) {
        console.warn("Painting Defect Type Upload Fetch Warning:", paintingUploadError.message);
      }

      const typedPaintingDefectTypeUploads = (paintingUploads || []).map((u: any) => ({
        id: u.id,
        filename: u.filename,
        recordCount: Number(u.record_count || 0),
        uploadDate: u.upload_date,
        createdAt: u.created_at
      }));
      setPaintingDefectTypeUploads(typedPaintingDefectTypeUploads);

      // 12. 조립불량유형 데이터 가져오기
      const { data: assemblyData, error: assemblyError } = await supabase
        .from('assembly_defect_type_data')
        .select('*')
        .order('data_date', { ascending: false });

      if (assemblyError) {
        console.warn("Assembly Defect Type Data Fetch Warning:", assemblyError.message);
      }

      const typedAssemblyDefectTypeData = (assemblyData || []).map((p: any) => ({
        id: p.id,
        uploadId: p.upload_id,
        customer: p.customer,
        partCode: p.part_code,
        partName: p.part_name,
        process: p.process,
        vehicleModel: p.vehicle_model,
        defectType1: Number(p.defect_type_1 || 0),
        defectType2: Number(p.defect_type_2 || 0),
        defectType3: Number(p.defect_type_3 || 0),
        defectType4: Number(p.defect_type_4 || 0),
        defectType5: Number(p.defect_type_5 || 0),
        defectType6: Number(p.defect_type_6 || 0),
        defectType7: Number(p.defect_type_7 || 0),
        defectType8: Number(p.defect_type_8 || 0),
        defectType9: Number(p.defect_type_9 || 0),
        defectType10: Number(p.defect_type_10 || 0),
        defectTypesDetail: p.defect_types_detail || {},
        totalDefects: Number(p.total_defects || 0),
        dataDate: p.data_date,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
      setAssemblyDefectTypeData(typedAssemblyDefectTypeData);

      // 13. 조립불량유형 업로드 이력 가져오기
      const { data: assemblyUploads, error: assemblyUploadError } = await supabase
        .from('assembly_defect_type_uploads')
        .select('*')
        .order('upload_date', { ascending: false });

      if (assemblyUploadError) {
        console.warn("Assembly Defect Type Upload Fetch Warning:", assemblyUploadError.message);
      }

      const typedAssemblyDefectTypeUploads = (assemblyUploads || []).map((u: any) => ({
        id: u.id,
        filename: u.filename,
        recordCount: Number(u.record_count || 0),
        uploadDate: u.upload_date,
        createdAt: u.created_at
      }));
      setAssemblyDefectTypeUploads(typedAssemblyDefectTypeUploads);

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

      // 기존 데이터 조회하여 id 매핑
      const dbPayload = await Promise.all(metricsArray.map(async m => {
        // 기존 레코드 검색 (maybeSingle: 없으면 null 반환, 에러 안남)
        const { data: existing } = await supabase
          .from('customer_metrics')
          .select('id')
          .eq('customer', m.customer)
          .eq('year', m.year)
          .eq('month', m.month)
          .maybeSingle();

        return {
          ...(existing?.id ? { id: existing.id } : {}),
          year: m.year,
          month: m.month,
          customer: m.customer,
          target: m.target,
          inspection_qty: m.inspectionQty,
          defects: m.defects,
          actual: m.actual
        };
      }));

      console.log("고객품질 지표 전송 데이터:", dbPayload);

      const { data, error } = await supabase
        .from('customer_metrics')
        .upsert(dbPayload)
        .select();

      if (error) {
        throw error;
      }

      console.log("고객품질 지표 저장 성공:", data);
      await fetchAllData();
      return true;

    } catch (e: any) {
      handleError(e, "지표 저장");
      return false;
    }
  };

  const handleSaveSupplierMetrics = async (payload: SupplierMetric | SupplierMetric[]) => {
    try {
      const metricsArray = Array.isArray(payload) ? payload : [payload];

      // 기존 데이터 조회하여 id 매핑
      const dbPayload = await Promise.all(metricsArray.map(async m => {
        // 기존 레코드 검색 (maybeSingle: 없으면 null 반환, 에러 안남)
        const { data: existing } = await supabase
          .from('supplier_metrics')
          .select('id')
          .eq('supplier', m.supplier)
          .eq('year', m.year)
          .eq('month', m.month)
          .maybeSingle();

        return {
          ...(existing?.id ? { id: existing.id } : {}),
          year: m.year,
          month: m.month,
          supplier: m.supplier,
          target: m.target,
          incoming_qty: m.incomingQty,
          inspection_qty: m.inspectionQty,
          defects: m.defects,
          actual: m.actual
        };
      }));

      console.log("협력업체 지표 전송 데이터:", dbPayload);

      const { data, error } = await supabase
        .from('supplier_metrics')
        .upsert(dbPayload)
        .select();

      if (error) {
        throw error;
      }

      console.log("협력업체 지표 저장 성공:", data);
      await fetchAllData();
      return true;

    } catch (e: any) {
      handleError(e, "협력업체 지표 저장");
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
        plan_date: entry.planDate, result_date: entry.resultDate, validation_check: entry.validationCheck || '',
        status: entry.status, progress_rate: entry.progressRate,
        attachments: entry.attachments || [], eight_d_data: entry.eightDData
      };

      const { error } = await supabase.from('ncr_entries').upsert(dbPayload);
      
      if (error) {
        throw error;
      }
      
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
        plan_date: merged.planDate, result_date: merged.resultDate, validation_check: merged.validationCheck || '',
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

  const handleSaveOutgoingMetrics = async (payload: OutgoingMetric | OutgoingMetric[]) => {
    try {
      const metricsArray = Array.isArray(payload) ? payload : [payload];
      const dbPayload = await Promise.all(metricsArray.map(async m => {
        const { data: existing } = await supabase.from('outgoing_metrics').select('id').eq('year', m.year).eq('month', m.month).maybeSingle();
        return { ...(existing?.id ? { id: existing.id } : {}), year: m.year, month: m.month, target: m.target, inspection_qty: m.inspectionQty, defects: m.defects, actual: m.actual };
      }));
      const { error } = await supabase.from('outgoing_metrics').upsert(dbPayload).select();
      if (error) throw error;
      await fetchAllData();
      return true;
    } catch (e: any) {
      handleError(e, "출하품질 지표 저장");
      return false;
    }
  };

  const handleSaveQuickResponse = async (entry: QuickResponseEntry) => {
    try {
      const dbPayload = {
        ...(entry.id ? { id: entry.id } : {}),
        date: entry.date, department: entry.department, machine_no: entry.machineNo, defect_count: entry.defectCount, model: entry.model,
        defect_type: entry.defectType, process: entry.process, defect_content: entry.defectContent, coating: entry.coating, area: entry.area,
        material_code: entry.materialCode, shielding: entry.shielding, action: entry.action, material_manager: entry.materialManager,
        meeting_attendance: entry.meetingAttendance, status_24h: entry.status24H, status_3d: entry.status3D, status_14day: entry.status14DAY,
        status_24d: entry.status24D, status_25d: entry.status25D, status_30d: entry.status30D, customer_mm: entry.customerMM, remarks: entry.remarks
      };
      const { error } = await supabase.from('quick_response_entries').upsert(dbPayload);
      if (error) throw error;
      await fetchAllData();
      alert('신속대응 데이터가 저장되었습니다.');
    } catch (e: any) {
      handleError(e, "신속대응 저장");
    }
  };

  const handleDeleteQuickResponse = async (id: string) => {
    if (!id) return;
    try {
      const { error } = await supabase.from('quick_response_entries').delete().eq('id', id);
      if (error) throw error;
      await fetchAllData();
    } catch (e: any) {
      handleError(e, "신속대응 삭제");
    }
  };

  const handleUploadProcessQuality = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      if (jsonData.length === 0) throw new Error('엑셀 파일에 데이터가 없습니다.');

      // ⭐ 기존 데이터 모두 삭제 (중복 누적 방지)
      const { error: deleteDataError } = await supabase.from('process_quality_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteDataError) throw deleteDataError;

      const { error: deleteUploadsError } = await supabase.from('process_quality_uploads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteUploadsError) throw deleteUploadsError;

      const { data: uploadRecord, error: uploadError } = await supabase.from('process_quality_uploads').insert({ filename: file.name, record_count: jsonData.length }).select().single();
      if (uploadError) throw uploadError;

      // Helper function to safely convert to number, defaulting to 0 if NaN
      const safeNumber = (value: any): number => {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      };

      // Helper function to find column value with flexible matching (removes brackets and extra spaces)
      const findColumnValue = (row: any, ...possibleNames: string[]): any => {
        // First try exact match
        for (const name of possibleNames) {
          if (row[name] !== undefined) return row[name];
        }
        // Then try flexible matching (remove brackets and trim)
        const keys = Object.keys(row);
        for (const name of possibleNames) {
          const normalizedName = name.replace(/\[.*?\]/g, '').trim();
          for (const key of keys) {
            const normalizedKey = key.replace(/\[.*?\]/g, '').trim();
            if (normalizedKey === normalizedName) return row[key];
          }
        }
        return undefined;
      };

      const processedData = jsonData.map((row: any) => {
        const productionQty = safeNumber(findColumnValue(row, '생산수량', '생산량') || 0);
        const defectQty = safeNumber(findColumnValue(row, '불량수량', '불량량') || 0);
        const defectRate = productionQty > 0 ? (defectQty / productionQty) * 100 : 0;
        return {
          upload_id: uploadRecord.id,
          customer: String(findColumnValue(row, '고객사', '거래처') || ''),
          part_type: String(findColumnValue(row, '공정', '공정구분', '부품유형') || ''),
          vehicle_model: findColumnValue(row, '품종', '차종', '모델') || null,
          product_name: findColumnValue(row, '품목명', '품명', '제품명') || null,
          production_qty: productionQty,
          defect_qty: defectQty,
          defect_amount: safeNumber(findColumnValue(row, '불량금액', '금액') || 0),
          defect_rate: defectRate,
          data_date: findColumnValue(row, '생산일자', '일자', '날짜') || new Date().toISOString().split('T')[0]
        };
      });

      const { error: dataError } = await supabase.from('process_quality_data').insert(processedData);
      if (dataError) throw dataError;

      await fetchAllData();
      alert('✅ 업로드 완료! ' + jsonData.length + '개의 데이터가 추가되었습니다.');
    } catch (e: any) {
      handleError(e, "공정불량 데이터 업로드");
      throw e;
    }
  };

  const handleUploadProcessDefectType = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Extract header row to get column names in correct order
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const headers: string[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
        const cell = worksheet[cellAddress];
        headers.push(cell ? String(cell.v) : `Column${col + 1}`);
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      if (jsonData.length === 0) throw new Error('엑셀 파일에 데이터가 없습니다.');

      // 기존 데이터 모두 삭제 (중복 누적 방지)
      const { error: deleteDataError } = await supabase.from('process_defect_type_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteDataError) throw deleteDataError;

      const { error: deleteUploadsError } = await supabase.from('process_defect_type_uploads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteUploadsError) throw deleteUploadsError;

      const { data: uploadRecord, error: uploadError } = await supabase.from('process_defect_type_uploads').insert({ filename: file.name, record_count: jsonData.length }).select().single();
      if (uploadError) throw uploadError;

      // Helper function to safely convert to number, defaulting to 0 if NaN
      const safeNumber = (value: any): number => {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      };

      // Helper function to find column value with flexible matching
      const findColumnValue = (row: any, ...possibleNames: string[]): any => {
        for (const name of possibleNames) {
          if (row[name] !== undefined) return row[name];
        }
        const keys = Object.keys(row);
        for (const name of possibleNames) {
          const normalizedName = name.replace(/\[.*?\]/g, '').trim();
          for (const key of keys) {
            const normalizedKey = key.replace(/\[.*?\]/g, '').trim();
            if (normalizedKey === normalizedName) return row[key];
          }
        }
        return undefined;
      };

      // N열은 14번째 컬럼 (인덱스 13), AG열은 33번째 컬럼 (인덱스 32)
      // 20개 컬럼만 불량유형으로 처리
      const defectTypeStartCol = 13; // N열 (0-based index)
      const defectTypeEndCol = 32;   // AG열 (0-based index)
      const defectTypeHeaders = headers.slice(defectTypeStartCol, defectTypeEndCol + 1);

      const processedData = jsonData.map((row: any) => {
        // Extract defect type columns from N to AG (20 columns)
        const defectTypes: Record<string, number> = {};
        const defectTypeValues: number[] = [];

        // Extract only columns N to AG
        defectTypeHeaders.forEach((header) => {
          const value = safeNumber(row[header]);
          // Only include if value > 0 (불량이 없으면 제외)
          if (value > 0) {
            defectTypes[header] = value;
            defectTypeValues.push(value);
          }
        });

        // Map first 10 defect types to dedicated columns
        const defectType1 = defectTypeValues[0] || 0;
        const defectType2 = defectTypeValues[1] || 0;
        const defectType3 = defectTypeValues[2] || 0;
        const defectType4 = defectTypeValues[3] || 0;
        const defectType5 = defectTypeValues[4] || 0;
        const defectType6 = defectTypeValues[5] || 0;
        const defectType7 = defectTypeValues[6] || 0;
        const defectType8 = defectTypeValues[7] || 0;
        const defectType9 = defectTypeValues[8] || 0;
        const defectType10 = defectTypeValues[9] || 0;

        const totalDefects = defectTypeValues.reduce((sum, val) => sum + val, 0);

        return {
          upload_id: uploadRecord.id,
          customer: findColumnValue(row, '고객사', '거래처', '사원') || null,
          part_code: findColumnValue(row, '품번', '부품번호', '자재번호') || null,
          part_name: findColumnValue(row, '품명', '부품명', '제품명') || null,
          process: findColumnValue(row, '공정', '공정명') || null,
          vehicle_model: findColumnValue(row, '품종', '차종', '모델') || null,
          defect_type_1: defectType1,
          defect_type_2: defectType2,
          defect_type_3: defectType3,
          defect_type_4: defectType4,
          defect_type_5: defectType5,
          defect_type_6: defectType6,
          defect_type_7: defectType7,
          defect_type_8: defectType8,
          defect_type_9: defectType9,
          defect_type_10: defectType10,
          defect_types_detail: defectTypes,
          total_defects: totalDefects,
          data_date: findColumnValue(row, '생산일자', '일자', '날짜') || new Date().toISOString().split('T')[0]
        };
      });

      const { error: dataError } = await supabase.from('process_defect_type_data').insert(processedData);
      if (dataError) throw dataError;

      await fetchAllData();
      alert('✅ 불량유형 데이터 업로드 완료! ' + jsonData.length + '개의 데이터가 추가되었습니다.');
    } catch (e: any) {
      handleError(e, "공정불량유형 데이터 업로드");
      throw e;
    }
  };

  const handleUploadPaintingDefectType = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Extract header row to get column names in correct order
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const headers: string[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
        const cell = worksheet[cellAddress];
        headers.push(cell ? String(cell.v) : `Column${col + 1}`);
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      if (jsonData.length === 0) throw new Error('엑셀 파일에 데이터가 없습니다.');

      // 기존 데이터 모두 삭제 (중복 누적 방지)
      const { error: deleteDataError } = await supabase.from('painting_defect_type_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteDataError) throw deleteDataError;

      const { error: deleteUploadsError } = await supabase.from('painting_defect_type_uploads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteUploadsError) throw deleteUploadsError;

      const { data: uploadRecord, error: uploadError } = await supabase.from('painting_defect_type_uploads').insert({ filename: file.name, record_count: jsonData.length }).select().single();
      if (uploadError) throw uploadError;

      // Helper function to safely convert to number, defaulting to 0 if NaN
      const safeNumber = (value: any): number => {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      };

      // Helper function to find column value with flexible matching
      const findColumnValue = (row: any, ...possibleNames: string[]): any => {
        for (const name of possibleNames) {
          if (row[name] !== undefined) return row[name];
        }
        const keys = Object.keys(row);
        for (const name of possibleNames) {
          const normalizedName = name.replace(/\[.*?\]/g, '').trim();
          for (const key of keys) {
            const normalizedKey = key.replace(/\[.*?\]/g, '').trim();
            if (normalizedKey === normalizedName) return row[key];
          }
        }
        return undefined;
      };

      // N열은 14번째 컬럼 (인덱스 13), AG열은 33번째 컬럼 (인덱스 32)
      // 20개 컬럼만 불량유형으로 처리
      const defectTypeStartCol = 13; // N열 (0-based index)
      const defectTypeEndCol = 32;   // AG열 (0-based index)
      const defectTypeHeaders = headers.slice(defectTypeStartCol, defectTypeEndCol + 1);

      const processedData = jsonData.map((row: any) => {
        // Extract defect type columns from N to AG (20 columns)
        const defectTypes: Record<string, number> = {};
        const defectTypeValues: number[] = [];

        // Extract only columns N to AG
        defectTypeHeaders.forEach((header) => {
          const value = safeNumber(row[header]);
          // Only include if value > 0 (불량이 없으면 제외)
          if (value > 0) {
            defectTypes[header] = value;
            defectTypeValues.push(value);
          }
        });

        // Map first 10 defect types to dedicated columns
        const defectType1 = defectTypeValues[0] || 0;
        const defectType2 = defectTypeValues[1] || 0;
        const defectType3 = defectTypeValues[2] || 0;
        const defectType4 = defectTypeValues[3] || 0;
        const defectType5 = defectTypeValues[4] || 0;
        const defectType6 = defectTypeValues[5] || 0;
        const defectType7 = defectTypeValues[6] || 0;
        const defectType8 = defectTypeValues[7] || 0;
        const defectType9 = defectTypeValues[8] || 0;
        const defectType10 = defectTypeValues[9] || 0;

        const totalDefects = defectTypeValues.reduce((sum, val) => sum + val, 0);

        return {
          upload_id: uploadRecord.id,
          customer: findColumnValue(row, '고객사', '거래처', '사원') || null,
          part_code: findColumnValue(row, '품번', '부품번호', '자재번호') || null,
          part_name: findColumnValue(row, '품명', '부품명', '제품명') || null,
          process: findColumnValue(row, '공정', '공정명') || null,
          vehicle_model: findColumnValue(row, '품종', '차종', '모델') || null,
          defect_type_1: defectType1,
          defect_type_2: defectType2,
          defect_type_3: defectType3,
          defect_type_4: defectType4,
          defect_type_5: defectType5,
          defect_type_6: defectType6,
          defect_type_7: defectType7,
          defect_type_8: defectType8,
          defect_type_9: defectType9,
          defect_type_10: defectType10,
          defect_types_detail: defectTypes,
          total_defects: totalDefects,
          data_date: findColumnValue(row, '생산일자', '일자', '날짜') || new Date().toISOString().split('T')[0]
        };
      });

      const { error: dataError } = await supabase.from('painting_defect_type_data').insert(processedData);
      if (dataError) throw dataError;

      await fetchAllData();
      alert('✅ 도장 불량유형 데이터 업로드 완료! ' + jsonData.length + '개의 데이터가 추가되었습니다.');
    } catch (e: any) {
      handleError(e, "도장불량유형 데이터 업로드");
      throw e;
    }
  };

  const handleUploadAssemblyDefectType = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Extract header row to get column names in correct order
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const headers: string[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
        const cell = worksheet[cellAddress];
        headers.push(cell ? String(cell.v) : `Column${col + 1}`);
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      if (jsonData.length === 0) throw new Error('엑셀 파일에 데이터가 없습니다.');

      // 기존 데이터 모두 삭제 (중복 누적 방지)
      const { error: deleteDataError } = await supabase.from('assembly_defect_type_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteDataError) throw deleteDataError;

      const { error: deleteUploadsError } = await supabase.from('assembly_defect_type_uploads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteUploadsError) throw deleteUploadsError;

      const { data: uploadRecord, error: uploadError } = await supabase.from('assembly_defect_type_uploads').insert({ filename: file.name, record_count: jsonData.length }).select().single();
      if (uploadError) throw uploadError;

      // Helper function to safely convert to number, defaulting to 0 if NaN
      const safeNumber = (value: any): number => {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      };

      // Helper function to find column value with flexible matching
      const findColumnValue = (row: any, ...possibleNames: string[]): any => {
        for (const name of possibleNames) {
          if (row[name] !== undefined) return row[name];
        }
        const keys = Object.keys(row);
        for (const name of possibleNames) {
          const normalizedName = name.replace(/\[.*?\]/g, '').trim();
          for (const key of keys) {
            const normalizedKey = key.replace(/\[.*?\]/g, '').trim();
            if (normalizedKey === normalizedName) return row[key];
          }
        }
        return undefined;
      };

      // N열은 14번째 컬럼 (인덱스 13), AG열은 33번째 컬럼 (인덱스 32)
      // 20개 컬럼만 불량유형으로 처리
      const defectTypeStartCol = 13; // N열 (0-based index)
      const defectTypeEndCol = 32;   // AG열 (0-based index)
      const defectTypeHeaders = headers.slice(defectTypeStartCol, defectTypeEndCol + 1);

      const processedData = jsonData.map((row: any) => {
        // Extract defect type columns from N to AG (20 columns)
        const defectTypes: Record<string, number> = {};
        const defectTypeValues: number[] = [];

        // Extract only columns N to AG
        defectTypeHeaders.forEach((header) => {
          const value = safeNumber(row[header]);
          // Only include if value > 0 (불량이 없으면 제외)
          if (value > 0) {
            defectTypes[header] = value;
            defectTypeValues.push(value);
          }
        });

        // Map first 10 defect types to dedicated columns
        const defectType1 = defectTypeValues[0] || 0;
        const defectType2 = defectTypeValues[1] || 0;
        const defectType3 = defectTypeValues[2] || 0;
        const defectType4 = defectTypeValues[3] || 0;
        const defectType5 = defectTypeValues[4] || 0;
        const defectType6 = defectTypeValues[5] || 0;
        const defectType7 = defectTypeValues[6] || 0;
        const defectType8 = defectTypeValues[7] || 0;
        const defectType9 = defectTypeValues[8] || 0;
        const defectType10 = defectTypeValues[9] || 0;

        const totalDefects = defectTypeValues.reduce((sum, val) => sum + val, 0);

        return {
          upload_id: uploadRecord.id,
          customer: findColumnValue(row, '고객사', '거래처', '사원') || null,
          part_code: findColumnValue(row, '품번', '부품번호', '자재번호') || null,
          part_name: findColumnValue(row, '품명', '부품명', '제품명') || null,
          process: findColumnValue(row, '공정', '공정명') || null,
          vehicle_model: findColumnValue(row, '품종', '차종', '모델') || null,
          defect_type_1: defectType1,
          defect_type_2: defectType2,
          defect_type_3: defectType3,
          defect_type_4: defectType4,
          defect_type_5: defectType5,
          defect_type_6: defectType6,
          defect_type_7: defectType7,
          defect_type_8: defectType8,
          defect_type_9: defectType9,
          defect_type_10: defectType10,
          defect_types_detail: defectTypes,
          total_defects: totalDefects,
          data_date: findColumnValue(row, '생산일자', '일자', '날짜') || new Date().toISOString().split('T')[0]
        };
      });

      const { error: dataError } = await supabase.from('assembly_defect_type_data').insert(processedData);
      if (dataError) throw dataError;

      await fetchAllData();
      alert('✅ 조립 불량유형 데이터 업로드 완료! ' + jsonData.length + '개의 데이터가 추가되었습니다.');
    } catch (e: any) {
      handleError(e, "조립불량유형 데이터 업로드");
      throw e;
    }
  };

  // DB 초기 설정 화면
  if (needsDatabaseSetup && isAuthenticated) {
    return (
      <DatabaseSetupScreen
        supabaseUrl={supabaseUrl}
        onSetupComplete={() => {
          setNeedsDatabaseSetup(false);
          fetchAllData();
        }}
        onSkip={() => {
          setNeedsDatabaseSetup(false);
        }}
      />
    );
  }

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
            {activeTab === 'overall' && <Dashboard ncrData={ncrData} customerMetrics={customerMetrics} supplierMetrics={supplierMetrics} processQualityData={processQualityData} outgoingMetrics={outgoingMetrics} />}
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
            {activeTab === 'incoming' && <IncomingQuality metrics={supplierMetrics} onSaveMetric={handleSaveSupplierMetrics} />}
            {activeTab === 'process' && <ProcessQuality data={processQualityData} uploads={processQualityUploads} onUpload={handleUploadProcessQuality} defectTypeData={processDefectTypeData} defectTypeUploads={processDefectTypeUploads} onUploadDefectType={handleUploadProcessDefectType} paintingDefectTypeData={paintingDefectTypeData} paintingDefectTypeUploads={paintingDefectTypeUploads} onUploadPaintingDefectType={handleUploadPaintingDefectType} assemblyDefectTypeData={assemblyDefectTypeData} assemblyDefectTypeUploads={assemblyDefectTypeUploads} onUploadAssemblyDefectType={handleUploadAssemblyDefectType} isLoading={isLoading} />}
            {activeTab === 'outgoing' && <OutgoingQuality metrics={outgoingMetrics} onSaveMetric={handleSaveOutgoingMetrics} />}
            {activeTab === 'quickresponse' && <QuickResponse data={quickResponseData} onSave={handleSaveQuickResponse} onDelete={handleDeleteQuickResponse} />}
          </div>
        )}
      </main>

      {showForm && <NCRForm initialData={editingEntry} onSave={handleSaveNCR} onDelete={handleDeleteNCR} onCancel={() => setShowForm(false)} />}
      {showEightD && selectedFor8D && <EightDReportModal entry={selectedFor8D} onSave={handleSave8D} onClose={() => setShowEightD(false)} />}
    </div>
  );
};

export default App;
