import { useState, useCallback, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type {
  ProcessQualityData,
  ProcessQualityUpload,
  ProcessQualityKPI,
  ProcessQualityByPartType,
  ProcessQualityByCustomer,
  ProcessQualityByVehicleModel,
  ProcessQualityByProductName,
  ProcessQualityTimeSeries,
  ProcessDefectTypeData,
  ProcessDefectTypeUpload,
  DefectTypeAnalysis,
  DefectTypeByProcess
} from '../types';

interface ProcessQualityProps {
  data: ProcessQualityData[];
  uploads: ProcessQualityUpload[];
  onUpload: (file: File) => Promise<void>;
  defectTypeData: ProcessDefectTypeData[];
  defectTypeUploads: ProcessDefectTypeUpload[];
  onUploadDefectType: (file: File) => Promise<void>;
  isLoading: boolean;
}

const PART_TYPE_COLORS: Record<string, string> = {
  "도장": "#3b82f6",
  "레이저": "#8b5cf6",
  "사출": "#ec4899",
  "인쇄": "#f59e0b",
  "조립": "#10b981",
  "증착": "#06b6d4",
  "도금": "#f97316",
};

const PART_TYPE_ORDER = ["사출", "도장", "인쇄", "조립", "도금", "레이저", "증착"];

export default function ProcessQuality({ data, uploads, onUpload, defectTypeData, defectTypeUploads, onUploadDefectType, isLoading }: ProcessQualityProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [showDefectTypeUpload, setShowDefectTypeUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingDefectType, setIsDraggingDefectType] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [defectTypeFile, setDefectTypeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingDefectType, setUploadingDefectType] = useState(false);
  const [activeTab, setActiveTab] = useState<'partType' | 'timeSeries' | 'defectType'>('partType');

  const hasData = data && data.length > 0;

  const kpiData: ProcessQualityKPI = useMemo(() => {
    if (!data || data.length === 0) {
      return { totalProduction: 0, totalDefects: 0, averageDefectRate: 0, totalDefectAmount: 0 };
    }
    const totalProduction = data.reduce((sum, item) => sum + item.productionQty, 0);
    const totalDefects = data.reduce((sum, item) => sum + item.defectQty, 0);
    const totalDefectAmount = data.reduce((sum, item) => sum + item.defectAmount, 0);
    const averageDefectRate = totalProduction > 0 ? (totalDefects / totalProduction) * 100 : 0;
    return { totalProduction, totalDefects, averageDefectRate, totalDefectAmount };
  }, [data]);

  const partTypeData: ProcessQualityByPartType[] = useMemo(() => {
    if (!data || data.length === 0) return [];
    const grouped = data.reduce((acc, item) => {
      if (!acc[item.partType]) {
        acc[item.partType] = { partType: item.partType, totalProduction: 0, totalDefects: 0, defectRate: 0, totalAmount: 0 };
      }
      acc[item.partType].totalProduction += item.productionQty;
      acc[item.partType].totalDefects += item.defectQty;
      acc[item.partType].totalAmount += item.defectAmount;
      return acc;
    }, {} as Record<string, ProcessQualityByPartType>);
    return Object.values(grouped).map(item => ({
      ...item,
      defectRate: item.totalProduction > 0 ? (item.totalDefects / item.totalProduction) * 100 : 0
    }));
  }, [data]);

  const customerData: ProcessQualityByCustomer[] = useMemo(() => {
    if (!data || data.length === 0) return [];
    const grouped = data.reduce((acc, item) => {
      if (!acc[item.customer]) {
        acc[item.customer] = { customer: item.customer, totalProduction: 0, totalDefects: 0, defectRate: 0, totalAmount: 0 };
      }
      acc[item.customer].totalProduction += item.productionQty;
      acc[item.customer].totalDefects += item.defectQty;
      acc[item.customer].totalAmount += item.defectAmount;
      return acc;
    }, {} as Record<string, ProcessQualityByCustomer>);
    return Object.values(grouped).map(item => ({
      ...item,
      defectRate: item.totalProduction > 0 ? (item.totalDefects / item.totalProduction) * 100 : 0
    })).sort((a, b) => b.defectRate - a.defectRate);
  }, [data]);

  const vehicleModelData: ProcessQualityByVehicleModel[] = useMemo(() => {
    if (!data || data.length === 0) return [];
    const grouped = data.reduce((acc, item) => {
      const model = item.vehicleModel || '미분류';
      if (!acc[model]) {
        acc[model] = { vehicleModel: model, totalProduction: 0, totalDefects: 0, defectRate: 0, totalAmount: 0 };
      }
      acc[model].totalProduction += item.productionQty;
      acc[model].totalDefects += item.defectQty;
      acc[model].totalAmount += item.defectAmount;
      return acc;
    }, {} as Record<string, ProcessQualityByVehicleModel>);
    return Object.values(grouped).map(item => ({
      ...item,
      defectRate: item.totalProduction > 0 ? (item.totalDefects / item.totalProduction) * 100 : 0
    })).sort((a, b) => b.defectRate - a.defectRate);
  }, [data]);

  const productNameData: ProcessQualityByProductName[] = useMemo(() => {
    if (!data || data.length === 0) return [];
    const grouped = data.reduce((acc, item) => {
      const product = item.productName || '미분류';
      if (!acc[product]) {
        acc[product] = { productName: product, totalProduction: 0, totalDefects: 0, defectRate: 0, totalAmount: 0 };
      }
      acc[product].totalProduction += item.productionQty;
      acc[product].totalDefects += item.defectQty;
      acc[product].totalAmount += item.defectAmount;
      return acc;
    }, {} as Record<string, ProcessQualityByProductName>);
    return Object.values(grouped).map(item => ({
      ...item,
      defectRate: item.totalProduction > 0 ? (item.totalDefects / item.totalProduction) * 100 : 0
    })).sort((a, b) => b.defectRate - a.defectRate);
  }, [data]);

  const timeSeriesData: ProcessQualityTimeSeries[] = useMemo(() => {
    if (!data || data.length === 0) return [];
    const grouped = data.reduce((acc, item) => {
      const date = item.dataDate;
      if (!acc[date]) {
        acc[date] = { date, totalProduction: 0, totalDefects: 0, defectRate: 0, totalAmount: 0 };
      }
      acc[date].totalProduction += item.productionQty;
      acc[date].totalDefects += item.defectQty;
      acc[date].totalAmount += item.defectAmount;
      return acc;
    }, {} as Record<string, any>);
    return Object.values(grouped)
      .map(item => ({
        date: new Date(item.date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
        defectRate: item.totalProduction > 0 ? (item.totalDefects / item.totalProduction) * 100 : 0,
        totalAmount: item.totalAmount
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  const chartData = useMemo(() => {
    const mapped = partTypeData.map(item => ({
      name: item.partType,
      불량률: parseFloat(item.defectRate.toFixed(2)),
      불량수량: item.totalDefects,
      생산수량: item.totalProduction,
    }));
    // Sort by PART_TYPE_ORDER
    return mapped.sort((a, b) => {
      const indexA = PART_TYPE_ORDER.indexOf(a.name);
      const indexB = PART_TYPE_ORDER.indexOf(b.name);
      // If not in order list, put at end
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [partTypeData]);

  const timeSeriesChartData = useMemo(() => timeSeriesData.map(item => ({
    date: item.date,
    불량률: parseFloat(item.defectRate.toFixed(2)),
    불량금액: item.totalAmount,
  })), [timeSeriesData]);

  // Defect Type Analysis
  const defectTypeAnalysis: DefectTypeAnalysis[] = useMemo(() => {
    if (!defectTypeData || defectTypeData.length === 0) return [];

    const totals: Record<string, number> = {};
    let grandTotal = 0;

    defectTypeData.forEach(item => {
      // Count defect types from defectType1 to defectType10
      for (let i = 1; i <= 10; i++) {
        const key = `defectType${i}` as keyof ProcessDefectTypeData;
        const value = Number(item[key]) || 0;
        if (value > 0) {
          const typeName = `불량유형 ${i}`;
          totals[typeName] = (totals[typeName] || 0) + value;
          grandTotal += value;
        }
      }

      // Also check defectTypesDetail
      if (item.defectTypesDetail) {
        Object.entries(item.defectTypesDetail).forEach(([type, count]) => {
          if (count > 0) {
            totals[type] = (totals[type] || 0) + count;
            grandTotal += count;
          }
        });
      }
    });

    return Object.entries(totals)
      .map(([defectType, count]) => ({
        defectType,
        count,
        percentage: grandTotal > 0 ? (count / grandTotal) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [defectTypeData]);

  const defectTypeByProcess: DefectTypeByProcess[] = useMemo(() => {
    if (!defectTypeData || defectTypeData.length === 0) return [];

    const grouped: Record<string, Record<string, number>> = {};

    defectTypeData.forEach(item => {
      const process = item.process || '미분류';
      if (!grouped[process]) grouped[process] = {};

      for (let i = 1; i <= 10; i++) {
        const key = `defectType${i}` as keyof ProcessDefectTypeData;
        const value = Number(item[key]) || 0;
        if (value > 0) {
          const typeName = `불량유형 ${i}`;
          grouped[process][typeName] = (grouped[process][typeName] || 0) + value;
        }
      }
    });

    return Object.entries(grouped).map(([process, types]) => {
      const totalDefects = Object.values(types).reduce((sum, count) => sum + count, 0);
      return {
        process,
        totalDefects,
        defectTypes: Object.entries(types)
          .map(([defectType, count]) => ({
            defectType,
            count,
            percentage: totalDefects > 0 ? (count / totalDefects) * 100 : 0
          }))
          .sort((a, b) => b.count - a.count)
      };
    }).sort((a, b) => b.totalDefects - a.totalDefects);
  }, [defectTypeData]);

  const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num);
  const formatCurrency = (num: number) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(num);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
    } else {
      alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
      setFile(null);
      setShowUpload(false);
    } catch (error: any) {
      alert('업로드 실패: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setUploading(false);
    }
  }, [file, onUpload]);

  // Defect Type Upload Handlers
  const handleDragOverDefectType = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDraggingDefectType(true); }, []);
  const handleDragLeaveDefectType = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDraggingDefectType(false); }, []);
  const handleDropDefectType = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingDefectType(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setDefectTypeFile(droppedFile);
    } else {
      alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
    }
  }, []);

  const handleFileSelectDefectType = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setDefectTypeFile(selectedFile);
  }, []);

  const handleUploadDefectType = useCallback(async () => {
    if (!defectTypeFile) return;
    setUploadingDefectType(true);
    try {
      await onUploadDefectType(defectTypeFile);
      setDefectTypeFile(null);
      setShowDefectTypeUpload(false);
    } catch (error: any) {
      alert('업로드 실패: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setUploadingDefectType(false);
    }
  }, [defectTypeFile, onUploadDefectType]);

  if (!hasData) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">공정불량 데이터를 업로드하세요</h2>
            <p className="text-slate-600">엑셀 파일을 업로드하여 공정불량 분석을 시작하세요</p>
          </div>
          <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={'border-2 border-dashed rounded-xl p-12 text-center transition-all ' + (isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50')}>
            <div className="flex flex-col items-center gap-4">
              {file ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button onClick={() => setFile(null)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">다른 파일 선택</button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900 mb-1">파일을 드래그하거나 클릭하여 선택하세요</p>
                    <p className="text-sm text-slate-500">엑셀 파일(.xlsx, .xls)만 지원됩니다</p>
                  </div>
                  <label htmlFor="file-input">
                    <button onClick={() => document.getElementById('file-input')?.click()} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      파일 선택
                    </button>
                  </label>
                  <input id="file-input" type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
                </>
              )}
            </div>
          </div>
          {file && (
            <div className="flex justify-end mt-4">
              <button onClick={handleUpload} disabled={uploading} className={'px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ' + (uploading ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700')}>
                {uploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    업로드 중...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    업로드
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">공정불량 현황 대시보드</h2>
          <p className="text-slate-600 mt-1">실시간 공정불량 데이터 분석 및 모니터링</p>
        </div>
        <button onClick={() => setShowUpload(!showUpload)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          데이터 업로드
        </button>
      </div>
      {showUpload && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">파일 업로드</h3>
          <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={'border-2 border-dashed rounded-xl p-12 text-center transition-all ' + (isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50')}>
            <div className="flex flex-col items-center gap-4">
              {file ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button onClick={() => setFile(null)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">다른 파일 선택</button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900 mb-1">파일을 드래그하거나 클릭하여 선택하세요</p>
                    <p className="text-sm text-slate-500">엑셀 파일(.xlsx, .xls)만 지원됩니다</p>
                  </div>
                  <label htmlFor="file-input-upload">
                    <button onClick={() => document.getElementById('file-input-upload')?.click()} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      파일 선택
                    </button>
                  </label>
                  <input id="file-input-upload" type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
                </>
              )}
            </div>
          </div>
          {file && (
            <div className="flex justify-end mt-4">
              <button onClick={handleUpload} disabled={uploading} className={'px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ' + (uploading ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700')}>
                {uploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    업로드 중...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    업로드
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-slate-600">총 생산수량</div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{formatNumber(kpiData.totalProduction)}</div>
          <p className="text-xs text-slate-500 mt-1">EA</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-slate-600">총 불량수량</div>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{formatNumber(kpiData.totalDefects)}</div>
          <p className="text-xs text-slate-500 mt-1">EA</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-slate-600">평균 불량률</div>
            <div className={'w-10 h-10 rounded-full flex items-center justify-center ' + (kpiData.averageDefectRate > 5 ? 'bg-red-100' : 'bg-green-100')}>
              <svg className={'w-5 h-5 ' + (kpiData.averageDefectRate > 5 ? 'text-red-600' : 'text-green-600')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={kpiData.averageDefectRate > 5 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{kpiData.averageDefectRate.toFixed(2)}</div>
          <p className="text-xs text-slate-500 mt-1">%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-slate-600">총 불량금액</div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{formatCurrency(kpiData.totalDefectAmount)}</div>
          <p className="text-xs text-slate-500 mt-1">KRW</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b border-slate-200">
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('partType')} className={'px-4 py-2 font-semibold transition-colors ' + (activeTab === 'partType' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900')}>부품유형별 분석</button>
            <button onClick={() => setActiveTab('timeSeries')} className={'px-4 py-2 font-semibold transition-colors ' + (activeTab === 'timeSeries' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900')}>추이 분석</button>
            <button onClick={() => setActiveTab('defectType')} className={'px-4 py-2 font-semibold transition-colors ' + (activeTab === 'defectType' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900')}>불량유형 분석</button>
          </div>
          {activeTab === 'defectType' && (
            <button onClick={() => setShowDefectTypeUpload(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              불량유형 파일 업로드
            </button>
          )}
        </div>
        {activeTab === 'partType' && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">부품유형별 불량률</h3>
            <p className="text-sm text-slate-600 mb-6">각 부품유형의 불량률을 비교합니다</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Bar dataKey="불량률" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (<Cell key={'cell-' + index} fill={PART_TYPE_COLORS[entry.name] || "#3b82f6"} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {activeTab === 'timeSeries' && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">불량률 추이</h3>
            <p className="text-sm text-slate-600 mb-6">시간에 따른 불량률 변화를 확인합니다</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="불량률" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {activeTab === 'defectType' && (
          <div>
            {defectTypeData && defectTypeData.length > 0 ? (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-2">불량유형별 분석 현황</h3>
                <p className="text-sm text-slate-600 mb-6">각 불량유형의 발생 빈도를 분석합니다</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={defectTypeAnalysis.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="defectType" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="불량 건수" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">불량유형 데이터가 없습니다</h3>
                <p className="text-slate-600 mb-4">불량유형 파일을 업로드하여 분석을 시작하세요</p>
                <button onClick={() => setShowDefectTypeUpload(true)} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 mx-auto">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  파일 업로드
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">고객사별 불량 현황</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">고객사</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">생산수량</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">불량수량</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">불량률</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">불량금액</th>
              </tr>
            </thead>
            <tbody>
              {customerData.map((customer, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900">{customer.customer}</td>
                  <td className="py-3 px-4 text-sm text-right text-slate-700">{formatNumber(customer.totalProduction)}</td>
                  <td className="py-3 px-4 text-sm text-right text-slate-700">{formatNumber(customer.totalDefects)}</td>
                  <td className="py-3 px-4 text-sm text-right">
                    <span className={'font-semibold ' + (customer.defectRate > 5 ? 'text-red-600' : 'text-green-600')}>{customer.defectRate.toFixed(2)}%</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-slate-700">{formatCurrency(customer.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">차종별 불량 현황</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">차종</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">생산수량</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">불량수량</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">불량률</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">불량금액</th>
              </tr>
            </thead>
            <tbody>
              {vehicleModelData.map((model, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900">{model.vehicleModel}</td>
                  <td className="py-3 px-4 text-sm text-right text-slate-700">{formatNumber(model.totalProduction)}</td>
                  <td className="py-3 px-4 text-sm text-right text-slate-700">{formatNumber(model.totalDefects)}</td>
                  <td className="py-3 px-4 text-sm text-right">
                    <span className={'font-semibold ' + (model.defectRate > 5 ? 'text-red-600' : 'text-green-600')}>{model.defectRate.toFixed(2)}%</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-slate-700">{formatCurrency(model.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">품명별 불량 현황</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">품명</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">생산수량</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">불량수량</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">불량률</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">불량금액</th>
              </tr>
            </thead>
            <tbody>
              {productNameData.map((product, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900">{product.productName}</td>
                  <td className="py-3 px-4 text-sm text-right text-slate-700">{formatNumber(product.totalProduction)}</td>
                  <td className="py-3 px-4 text-sm text-right text-slate-700">{formatNumber(product.totalDefects)}</td>
                  <td className="py-3 px-4 text-sm text-right">
                    <span className={'font-semibold ' + (product.defectRate > 5 ? 'text-red-600' : 'text-green-600')}>{product.defectRate.toFixed(2)}%</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-slate-700">{formatCurrency(product.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">업로드 이력</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">파일명</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">레코드 수</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">업로드 일시</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((upload, index) => (
                <tr key={upload.id || index} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900">{upload.filename}</td>
                  <td className="py-3 px-4 text-sm text-right text-slate-700">{formatNumber(upload.recordCount)}</td>
                  <td className="py-3 px-4 text-sm text-right text-slate-700">{new Date(upload.uploadDate).toLocaleString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Defect Type Analysis Sections */}
      {defectTypeData && defectTypeData.length > 0 && (
        <>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">공정별 불량유형 분석</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">공정</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">총 불량 건수</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">주요 불량유형 (상위 3개)</th>
                  </tr>
                </thead>
                <tbody>
                  {defectTypeByProcess.map((process, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{process.process}</td>
                      <td className="py-3 px-4 text-sm text-right text-slate-700">{formatNumber(process.totalDefects)}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">
                        {process.defectTypes.slice(0, 3).map((dt, idx) => (
                          <span key={idx} className="inline-block mr-3">
                            {dt.defectType}: <span className="font-semibold text-purple-600">{formatNumber(dt.count)}</span> ({dt.percentage.toFixed(1)}%)
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">불량유형별 상세 현황</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">불량유형</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">발생 건수</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">비율</th>
                  </tr>
                </thead>
                <tbody>
                  {defectTypeAnalysis.map((type, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{type.defectType}</td>
                      <td className="py-3 px-4 text-sm text-right text-slate-700">{formatNumber(type.count)}</td>
                      <td className="py-3 px-4 text-sm text-right">
                        <span className="font-semibold text-purple-600">{type.percentage.toFixed(2)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">불량유형 업로드 이력</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">파일명</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">레코드 수</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">업로드 일시</th>
                  </tr>
                </thead>
                <tbody>
                  {defectTypeUploads.map((upload, index) => (
                    <tr key={upload.id || index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{upload.filename}</td>
                      <td className="py-3 px-4 text-sm text-right text-slate-700">{formatNumber(upload.recordCount)}</td>
                      <td className="py-3 px-4 text-sm text-right text-slate-700">{new Date(upload.uploadDate).toLocaleString('ko-KR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Defect Type Upload Modal */}
      {showDefectTypeUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">불량유형 파일 업로드</h2>
              <button onClick={() => { setShowDefectTypeUpload(false); setDefectTypeFile(null); }} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div onDragOver={handleDragOverDefectType} onDragLeave={handleDragLeaveDefectType} onDrop={handleDropDefectType} className={'border-2 border-dashed rounded-xl p-12 text-center transition-all mb-6 ' + (isDraggingDefectType ? 'border-purple-500 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50')}>
              <div className="flex flex-col items-center gap-4">
                {defectTypeFile ? (
                  <>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{defectTypeFile.name}</p>
                      <p className="text-sm text-slate-500">{(defectTypeFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <button onClick={() => setDefectTypeFile(null)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">다른 파일 선택</button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900 mb-1">파일을 드래그하거나 클릭하여 선택하세요</p>
                      <p className="text-sm text-slate-500">엑셀 파일(.xlsx, .xls)만 지원됩니다</p>
                    </div>
                    <label htmlFor="defect-type-file-input">
                      <button onClick={() => document.getElementById('defect-type-file-input')?.click()} className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        파일 선택
                      </button>
                    </label>
                    <input id="defect-type-file-input" type="file" accept=".xlsx,.xls" onChange={handleFileSelectDefectType} className="hidden" />
                  </>
                )}
              </div>
            </div>
            {defectTypeFile && (
              <div className="flex gap-3">
                <button onClick={() => { setShowDefectTypeUpload(false); setDefectTypeFile(null); }} className="flex-1 px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold">
                  취소
                </button>
                <button onClick={handleUploadDefectType} disabled={uploadingDefectType} className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {uploadingDefectType ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      업로드
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
