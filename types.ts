
export type NCRStatus = 'Open' | 'Closed' | 'Delay';

export interface NCRAttachment {
  name: string;
  data: string; // Base64 encoded string
  type: string;
}

export interface EightDData {
  docNo: string;
  lastUpdate: string;
  relatedPerson: {
    actionDetail: string;
    assemblyTeam: string;
    developmentTeam: string;
  };
  sevenW: {
    who: string;
    what: string;
    when: string;
    where: string;
    why: string;
    howMany: string;
    howOften: string;
  };
  containment: string;
  rootCause: {
    whyHappened: string[];
    whyNotDetected: string[];
  };
  countermeasures: Array<{
    type: 'Prevent' | 'Detection';
    action: string;
    owner: string;
    complete: string;
    implement: string;
    status: string;
  }>;
  verification: Array<{
    item: string;
    yes: boolean;
    no: boolean;
    date: string;
  }>;
  prevention: Array<{
    standard: string;
    owner: string;
    complete: string;
    readAcross: string;
    raOwner: string;
    raComplete: string;
  }>;
  reviewAndConfirm: string;
  approvals: {
    madeBy: string;
    reviewBy: string;
    approveBy: string;
    date: string;
  };
}

export interface NCREntry {
  id: string;
  month: number;
  day: number;
  source: string;
  customer: string;
  model: string;
  partName: string;
  partNo: string;
  defectContent: string;
  outflowCause: string;
  rootCause: string;
  countermeasure: string;
  planDate: string;
  resultDate: string;
  effectivenessCheck: string;
  status: NCRStatus;
  progressRate: number;
  remarks: string;
  attachments: NCRAttachment[]; 
  eightDData?: EightDData;
}

export interface CustomerMetric {
  id?: string;
  year: number;
  customer: string;
  month: number;
  target: number; // 목표 PPM
  inspectionQty: number; // 검사수량
  defects: number; // 불량수량
  actual: number; // 계산된 실적 PPM
}

export interface SupplierMetric {
  id?: string;
  year: number;
  supplier: string;
  month: number;
  target: number; // 목표 PPM
  incomingQty: number; // 입고수량
  inspectionQty: number; // 검사수량
  defects: number; // 불량수량
  actual: number; // 계산된 실적 PPM
}

export interface OutgoingMetric {
  id?: string;
  year: number;
  month: number;
  target: number; // 목표 PPM
  inspectionQty: number; // 검사수량
  defects: number; // 불량수량
  actual: number; // 계산된 실적 PPM
}

export interface QuickResponseEntry {
  id?: string;
  date: string; // YYYY-MM-DD 형식
  department: string;
  machineNo: string;
  defectCount: number;
  model: string;
  defectType: string;
  process: string;
  defectContent: string;
  coating: string;
  area: string;
  materialCode: string;
  shielding: string;
  action: string;
  materialManager: string;
  meetingAttendance: string;
  status24H: string;
  status3D: string;
  status14DAY: string;
  status24D: string;
  status25D: string;
  status30D: string;
  customerMM: string;
  remarks: string;
}

export interface ProcessQualityUpload {
  id?: string;
  filename: string;
  recordCount: number;
  uploadDate: string;
  createdAt?: string;
}

export interface ProcessQualityData {
  id?: string;
  uploadId: string;
  customer: string;
  partType: string; // 도장, 레이저, 사출, 인쇄, 조립, 증착
  vehicleModel?: string;
  productName?: string;
  productionQty: number;
  defectQty: number;
  defectAmount: number;
  defectRate: number;
  dataDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProcessQualityKPI {
  totalProduction: number;
  totalDefects: number;
  averageDefectRate: number;
  totalDefectAmount: number;
}

export interface ProcessQualityByPartType {
  partType: string;
  totalProduction: number;
  totalDefects: number;
  defectRate: number;
  totalAmount: number;
}

export interface ProcessQualityByCustomer {
  customer: string;
  totalProduction: number;
  totalDefects: number;
  defectRate: number;
  totalAmount: number;
}

export interface ProcessQualityTimeSeries {
  date: string;
  defectRate: number;
  totalAmount: number;
}

export interface ProcessQualityByVehicleModel {
  vehicleModel: string;
  totalProduction: number;
  totalDefects: number;
  defectRate: number;
  totalAmount: number;
}

export interface ProcessQualityByProductName {
  productName: string;
  totalProduction: number;
  totalDefects: number;
  defectRate: number;
  totalAmount: number;
}

export interface DashboardTab {
  id: 'overall' | 'ncr' | 'customer' | 'incoming' | 'process' | 'outgoing' | 'quickresponse';
  label: string;
}

// Process Defect Type Interfaces
export interface ProcessDefectTypeUpload {
  id?: string;
  filename: string;
  recordCount: number;
  uploadDate: string;
  createdAt?: string;
}

export interface ProcessDefectTypeData {
  id?: string;
  uploadId: string;
  customer?: string;
  partCode?: string;
  partName?: string;
  process?: string;
  vehicleModel?: string;
  defectType1: number;
  defectType2: number;
  defectType3: number;
  defectType4: number;
  defectType5: number;
  defectType6: number;
  defectType7: number;
  defectType8: number;
  defectType9: number;
  defectType10: number;
  defectTypesDetail?: Record<string, number>;
  totalDefects: number;
  dataDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DefectTypeAnalysis {
  defectType: string;
  count: number;
  percentage: number;
}

export interface DefectTypeByProcess {
  process: string;
  totalDefects: number;
  defectTypes: DefectTypeAnalysis[];
}

export interface DefectTypeByCustomer {
  customer: string;
  totalDefects: number;
  defectTypes: DefectTypeAnalysis[];
}

// Painting Defect Type Interfaces
export interface PaintingDefectTypeUpload {
  id?: string;
  filename: string;
  recordCount: number;
  uploadDate: string;
  createdAt?: string;
}

export interface PaintingDefectTypeData {
  id?: string;
  uploadId: string;
  customer?: string;
  partCode?: string;
  partName?: string;
  process?: string;
  vehicleModel?: string;
  defectType1: number;
  defectType2: number;
  defectType3: number;
  defectType4: number;
  defectType5: number;
  defectType6: number;
  defectType7: number;
  defectType8: number;
  defectType9: number;
  defectType10: number;
  defectTypesDetail?: Record<string, number>;
  totalDefects: number;
  dataDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Assembly Defect Type Interfaces
export interface AssemblyDefectTypeUpload {
  id?: string;
  filename: string;
  recordCount: number;
  uploadDate: string;
  createdAt?: string;
}

export interface AssemblyDefectTypeData {
  id?: string;
  uploadId: string;
  customer?: string;
  partCode?: string;
  partName?: string;
  process?: string;
  vehicleModel?: string;
  defectType1: number;
  defectType2: number;
  defectType3: number;
  defectType4: number;
  defectType5: number;
  defectType6: number;
  defectType7: number;
  defectType8: number;
  defectType9: number;
  defectType10: number;
  defectTypesDetail?: Record<string, number>;
  totalDefects: number;
  dataDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
