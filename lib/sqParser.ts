import * as XLSX from 'xlsx';
import { SQEvaluation, SQEvalItem, SQCategoryScore, SQGrade, SQComplianceStatus } from '../types';

type PartialEval = Omit<SQEvaluation, 'id' | 'createdAt' | 'updatedAt'>;
type PartialItem = Omit<SQEvalItem, 'id' | 'evaluationId' | 'createdAt' | 'updatedAt'>;

export interface SQParseResult {
  evaluation: PartialEval;
  items: PartialItem[];
}

function getCellValue(sheet: XLSX.WorkSheet, ref: string): any {
  const cell = sheet[ref];
  return cell ? cell.v : null;
}

function getCellString(sheet: XLSX.WorkSheet, ref: string): string {
  const v = getCellValue(sheet, ref);
  if (v == null) return '';
  if (v instanceof Date) {
    return v.toISOString().split('T')[0];
  }
  return String(v).trim();
}

function getCellNumber(sheet: XLSX.WorkSheet, ref: string): number {
  const v = getCellValue(sheet, ref);
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function parseDate(v: any): string {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().split('T')[0];
  const s = String(v);
  // Try parsing ISO or date-like strings
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return s;
}

function parseHeader(sheet: XLSX.WorkSheet): {
  evaluationDate: string;
  businessType: string;
  companyName: string;
  leadCompany: string;
  evaluator: string;
} {
  return {
    evaluationDate: parseDate(getCellValue(sheet, 'B4')),
    businessType: getCellString(sheet, 'C18'),
    companyName: getCellString(sheet, 'C19'),
    leadCompany: getCellString(sheet, 'C20'),
    evaluator: getCellString(sheet, 'C22'),
  };
}

// Column mapping for category scores in 보고서 메인 sheet
// Row 22 = category labels with max scores in AD22 (총점 header)
// Row 23 = actual scores with grade in AD23
const CATEGORY_COLS = [
  { col: 'E', label: '생산조건관리' },
  { col: 'I', label: '검사시험' },
  { col: 'K', label: '설비관리' },
  { col: 'M', label: '금형관리' },
  { col: 'O', label: '자재관리' },
  { col: 'T', label: '품질경영체제' },
];

function parseMainReport(sheet: XLSX.WorkSheet): {
  totalScore: number;
  grade: SQGrade;
  categoryScores: SQCategoryScore[];
} {
  const totalScore = getCellNumber(sheet, 'AD22');
  const gradeStr = getCellString(sheet, 'AD23');
  const grade = (['A', 'B', 'C', 'D'].includes(gradeStr) ? gradeStr : 'D') as SQGrade;

  const categoryScores: SQCategoryScore[] = [];

  for (const { col, label } of CATEGORY_COLS) {
    const score = getCellNumber(sheet, `${col}23`);
    // Try to get max from row 22 — but row 22 often has labels, not numbers
    // Max scores are in the subtotal rows of 평가결과 sheet, so we'll compute from items later
    // For now, mark maxScore=0 and fill in after parsing items
    // But let's try: the label cell might have a number nearby
    const maxCandidate = getCellNumber(sheet, `${col}22`);

    // Only add if the column has relevant data (skip if label is empty and score is 0)
    const labelCheck = getCellString(sheet, `${col}22`);
    if (labelCheck || score > 0 || maxCandidate > 0) {
      categoryScores.push({
        category: label,
        score,
        maxScore: maxCandidate > 0 ? maxCandidate : 0,
        percentage: maxCandidate > 0 ? Math.round((score / maxCandidate) * 100) : 0,
      });
    }
  }

  return { totalScore, grade, categoryScores };
}

function parseEvalItems(sheet: XLSX.WorkSheet): {
  items: PartialItem[];
  categoryMaxScores: Record<string, number>;
} {
  const items: PartialItem[] = [];
  const categoryMaxScores: Record<string, number> = {};
  let currentCategory = '';

  // Find the data range
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:H200');
  const maxRow = Math.min(range.e.r + 1, 200);

  for (let r = 3; r < maxRow; r++) { // Start from row 4 (0-indexed row 3)
    const rowNum = r + 1; // 1-indexed
    const colA = getCellString(sheet, `A${rowNum}`);
    const colB = getCellString(sheet, `B${rowNum}`);

    // Skip empty rows
    if (!colA && !colB) continue;

    // Category subtotal row (◈)
    if (colA === '◈') {
      const subtotalCategory = getCellString(sheet, `B${rowNum}`).replace('_합', '');
      const maxScore = getCellNumber(sheet, `D${rowNum}`);
      if (subtotalCategory && maxScore > 0) {
        categoryMaxScores[subtotalCategory] = maxScore;
      }
      continue;
    }

    // Grand total row (★)
    if (colA === '★') continue;

    // Regular item row: A has item_no like "1_1", "2_3" etc
    if (/^\d+_\d+$/.test(colA)) {
      // Update category if B column has value
      if (colB) {
        currentCategory = colB;
      }

      const subItem = getCellString(sheet, `C${rowNum}`);
      const maxScore = getCellNumber(sheet, `D${rowNum}`);
      const complianceStr = getCellString(sheet, `E${rowNum}`);
      const actualScore = getCellNumber(sheet, `F${rowNum}`);
      const finding = getCellString(sheet, `G${rowNum}`);
      const additionalFinding = getCellString(sheet, `H${rowNum}`);

      const validStatuses: SQComplianceStatus[] = [
        '우수', '양호', '보완', '일부미흡', '다수미흡', '미흡', '미관리', '해당없음'
      ];
      const complianceStatus = validStatuses.includes(complianceStr as SQComplianceStatus)
        ? (complianceStr as SQComplianceStatus)
        : null;

      items.push({
        itemNo: colA,
        category: currentCategory,
        subItem: subItem.substring(0, 5000), // Truncate very long text
        maxScore,
        complianceStatus,
        actualScore,
        finding,
        additionalFinding,
      });
    }
  }

  return { items, categoryMaxScores };
}

export function parseSQExcel(workbook: XLSX.WorkBook): SQParseResult {
  // Validate required sheets
  const requiredSheets = ['표지', '보고서 메인', '평가결과'];
  for (const name of requiredSheets) {
    if (!workbook.SheetNames.includes(name)) {
      throw new Error(`필수 시트 "${name}"을(를) 찾을 수 없습니다. SQ 평가서 양식을 확인해주세요.`);
    }
  }

  // Parse header (표지)
  const header = parseHeader(workbook.Sheets['표지']);

  // Parse main report (보고서 메인)
  const mainReport = parseMainReport(workbook.Sheets['보고서 메인']);

  // Parse evaluation items (평가결과)
  const { items, categoryMaxScores } = parseEvalItems(workbook.Sheets['평가결과']);

  // Fill in category maxScores from subtotal rows
  const categoryScores = mainReport.categoryScores.map(cs => {
    const maxFromItems = categoryMaxScores[cs.category];
    const maxScore = maxFromItems || cs.maxScore;
    return {
      ...cs,
      maxScore,
      percentage: maxScore > 0 ? Math.round((cs.score / maxScore) * 100) : 0,
    };
  });

  // Remove categories with 0 maxScore (not applicable for this business type)
  const filteredScores = categoryScores.filter(cs => cs.maxScore > 0);

  // Calculate total maxScore from items if main report value seems off
  const totalMaxFromItems = Object.values(categoryMaxScores).reduce((a, b) => a + b, 0);

  const evaluation: PartialEval = {
    evaluationDate: header.evaluationDate,
    businessType: header.businessType,
    companyName: header.companyName,
    leadCompany: header.leadCompany,
    evaluator: header.evaluator,
    totalScore: mainReport.totalScore,
    maxScore: totalMaxFromItems > 0 ? totalMaxFromItems : 1000,
    grade: mainReport.grade,
    categoryScores: filteredScores,
  };

  return { evaluation, items };
}
