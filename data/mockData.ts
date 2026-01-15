
import { NCREntry } from '../types';

export const INITIAL_NCR_DATA: NCREntry[] = [
  {
    id: '1',
    month: 1,
    day: 14,
    source: 'LGE',
    customer: 'LGE',
    model: 'MA',
    partName: "KNOB ASS'Y",
    partNo: 'AGM30017701',
    defectContent: '박스 취급 문제로 KNOB이 뒤집히면서 CAP에 TRAY 자국 발생',
    outflowCause: '사내 재고 선별 시 발견되지 않았으나 물류 이동 중 발생',
    rootCause: 'KNOB 포장 TRAY가 KNOB에 비해 높아 안착 시 공간이 많이 남음',
    countermeasure: 'TRAY 높이 개선 (33.7mm -> 25.8mm)',
    planDate: '2025-01-14',
    resultDate: '2025-02-14',
    effectivenessCheck: '개선품 확인 시 제품 뒤집힘 없음',
    status: 'Delay',
    progressRate: 86,
    remarks: '미완료 - 추가 외관 불량 발생됨',
    attachments: []
  },
  {
    id: '2',
    month: 1,
    day: 18,
    source: 'LGE',
    customer: 'LGE',
    model: 'ccRC JXFL',
    partName: "PANEL ASS'Y L/R",
    partNo: 'AGL30175701',
    defectContent: 'LCD 특정 영역 가압 시 이음 발생',
    outflowCause: '재도장품에 대한 검증 프로세스 미흡',
    rootCause: 'Panel 재도장 진행하여 Guide Hole 치수 축소 및 체결 부하 발생',
    countermeasure: '품질팀 도장사 정기 공정 점검 및 수입검사 반영',
    planDate: '2025-01-18',
    resultDate: '2025-02-18',
    effectivenessCheck: '수입검사 시 홀치수 측정 관리 중',
    status: 'Closed',
    progressRate: 100,
    remarks: '완료',
    attachments: []
  },
  {
    id: '3',
    month: 2,
    day: 13,
    source: '모트렉스',
    customer: 'MTX',
    model: 'VP2NG',
    partName: "KNOB ASS'Y",
    partNo: 'AGM30175701',
    defectContent: 'Body 오염에 의한 이물 발생',
    outflowCause: '출하 검사 시 오염 확인 안됨',
    rootCause: 'KNOB을 눕혀 포장하면서 Body 상단부 오염 추정',
    countermeasure: '포장 CASE 재사용 금지 및 최종 비닐 포장 밀봉',
    planDate: '2025-02-13',
    resultDate: '2025-03-13',
    effectivenessCheck: '적입방법 변경 확인',
    status: 'Closed',
    progressRate: 94,
    remarks: '완료',
    attachments: []
  }
];

export const CUSTOMER_LIST = [
  'LGE',
  'MTX',
  '동국실업',
  '동아전기',
  '모베이스',
  '하이게인 안테나',
  '한빛 T&I'
];
