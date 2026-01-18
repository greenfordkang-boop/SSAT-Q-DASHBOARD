
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

export type ResponseStatus = 'G' | 'R' | 'Y' | 'N/A';

export interface QuickResponseEntry {
  id?: string;
  date: string; // 발생일자
  department: string; // 부서
  machineNo: string; // 호기
  defectCount: number; // 불량수
  model: string; // 모델명
  defectType: string; // 불량
  process: string; // 공정
  defectContent: string; // 불량내용
  coating: string; // 코팅
  area: string; // 부위
  materialCode: string; // 재료코드
  shielding: string; // 차폐
  action: string; // 조치
  materialManager: string; // 자재담당자
  meetingAttendance: string; // 지적회의 참석여부
  status24H: ResponseStatus; // 24시간 대응 상태
  status3D: ResponseStatus; // 3일 대응 상태
  status14DAY: ResponseStatus; // 14일 대응 상태
  status24D: ResponseStatus; // 24일 대응 상태
  status25D: ResponseStatus; // 25일 대응 상태
  status30D: ResponseStatus; // 30일 대응 상태
  customerMM: string; // 고객 MM 여부
  remarks: string; // 비고
}

export interface DashboardTab {
  id: 'overall' | 'ncr' | 'customer' | 'incoming' | 'process' | 'outgoing' | 'quickresponse';
  label: string;
}

// Process Quality Types
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
