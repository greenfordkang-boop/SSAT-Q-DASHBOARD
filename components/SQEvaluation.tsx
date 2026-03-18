import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { supabase } from '../lib/supabaseClient';
import { parseSQExcel, SQParseResult } from '../lib/sqParser';
import {
  SQEvaluation as SQEvalType, SQEvalItem, SQImprovement,
  SQImprovementStatus, SQCategoryScore
} from '../types';
import SortableHeader from './SortableHeader';
import { useTableControls } from '../hooks/useTableControls';

// ===== Helper =====
function gradeColor(grade: string) {
  switch (grade) {
    case 'A': return 'text-green-600 bg-green-50';
    case 'B': return 'text-blue-600 bg-blue-50';
    case 'C': return 'text-yellow-600 bg-yellow-50';
    default: return 'text-red-600 bg-red-50';
  }
}

function statusBadge(status: SQImprovementStatus) {
  switch (status) {
    case '완료': return 'bg-green-100 text-green-800';
    case '진행중': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function complianceColor(status: string | null) {
  if (!status) return '';
  switch (status) {
    case '우수': return 'text-green-700';
    case '양호': return 'text-blue-700';
    case '보완': return 'text-yellow-700';
    case '일부미흡': return 'text-orange-600';
    case '다수미흡': return 'text-orange-700';
    case '미흡': return 'text-red-600';
    case '미관리': return 'text-red-700 font-bold';
    default: return 'text-gray-500';
  }
}

const SUB_TABS = ['미흡항목', '전체항목', '개선활동', '평가이력'] as const;
type SubTab = typeof SUB_TABS[number];

// ===== Main Component =====
const SQEvaluation: React.FC = () => {
  // Data state
  const [evaluations, setEvaluations] = useState<SQEvalType[]>([]);
  const [items, setItems] = useState<SQEvalItem[]>([]);
  const [improvements, setImprovements] = useState<SQImprovement[]>([]);
  const [selectedEvalId, setSelectedEvalId] = useState<string>('');
  const [subTab, setSubTab] = useState<SubTab>('미흡항목');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsePreview, setParsePreview] = useState<SQParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Table controls
  const itemsTable = useTableControls(true);
  const improvementsTable = useTableControls(true);
  const historyTable = useTableControls(true);

  // Improvement form state
  const [showImpForm, setShowImpForm] = useState(false);
  const [impFormData, setImpFormData] = useState<Partial<SQImprovement>>({});
  const [editingImpId, setEditingImpId] = useState<string | null>(null);

  // ===== Data Loading =====
  const loadEvaluations = useCallback(async () => {
    const { data } = await supabase
      .from('sq_evaluations')
      .select('*')
      .order('evaluation_date', { ascending: false });
    if (data) {
      const mapped: SQEvalType[] = data.map((d: any) => ({
        id: d.id,
        evaluationDate: d.evaluation_date,
        businessType: d.business_type,
        companyName: d.company_name,
        leadCompany: d.lead_company,
        evaluator: d.evaluator,
        totalScore: Number(d.total_score),
        maxScore: Number(d.max_score),
        grade: d.grade,
        categoryScores: d.category_scores || [],
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
      setEvaluations(mapped);
      if (mapped.length > 0 && !selectedEvalId) {
        setSelectedEvalId(mapped[0].id!);
      }
    }
  }, [selectedEvalId]);

  const loadItems = useCallback(async (evalId: string) => {
    if (!evalId) return;
    const { data } = await supabase
      .from('sq_eval_items')
      .select('*')
      .eq('evaluation_id', evalId)
      .order('item_no');
    if (data) {
      setItems(data.map((d: any) => ({
        id: d.id,
        evaluationId: d.evaluation_id,
        itemNo: d.item_no,
        category: d.category,
        subItem: d.sub_item || '',
        maxScore: Number(d.max_score),
        complianceStatus: d.compliance_status,
        actualScore: Number(d.actual_score),
        finding: d.finding || '',
        additionalFinding: d.additional_finding || '',
      })));
    }
  }, []);

  const loadImprovements = useCallback(async (evalId: string) => {
    if (!evalId) return;
    const { data } = await supabase
      .from('sq_improvements')
      .select('*')
      .eq('evaluation_id', evalId)
      .order('created_at', { ascending: false });
    if (data) {
      setImprovements(data.map((d: any) => ({
        id: d.id,
        evaluationId: d.evaluation_id,
        itemNo: d.item_no,
        category: d.category || '',
        issueDescription: d.issue_description,
        improvementPlan: d.improvement_plan || '',
        responsiblePerson: d.responsible_person || '',
        dueDate: d.due_date || '',
        status: d.status,
        completionDate: d.completion_date || '',
        evidence: d.evidence || '',
      })));
    }
  }, []);

  useEffect(() => { loadEvaluations(); }, [loadEvaluations]);
  useEffect(() => {
    if (selectedEvalId) {
      loadItems(selectedEvalId);
      loadImprovements(selectedEvalId);
    }
  }, [selectedEvalId, loadItems, loadImprovements]);

  const selectedEval = evaluations.find(e => e.id === selectedEvalId);

  // ===== Excel Upload =====
  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    setParsePreview(null);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { cellDates: true });
      const result = parseSQExcel(wb);
      setParsePreview(result);
    } catch (err: any) {
      setUploadError(err.message || '파일 파싱에 실패했습니다.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.xlsx')) handleFileSelect(file);
    else setUploadError('.xlsx 파일만 업로드 가능합니다.');
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const confirmUpload = async () => {
    if (!parsePreview) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { evaluation, items: parsedItems } = parsePreview;

      // Check for existing evaluation (same business_type + date)
      const { data: existing } = await supabase
        .from('sq_evaluations')
        .select('id')
        .eq('business_type', evaluation.businessType)
        .eq('evaluation_date', evaluation.evaluationDate)
        .maybeSingle();

      let evalId: string;

      if (existing) {
        // Update existing
        const { error: updateErr } = await supabase
          .from('sq_evaluations')
          .update({
            company_name: evaluation.companyName,
            lead_company: evaluation.leadCompany,
            evaluator: evaluation.evaluator,
            total_score: evaluation.totalScore,
            max_score: evaluation.maxScore,
            grade: evaluation.grade,
            category_scores: evaluation.categoryScores,
          })
          .eq('id', existing.id);
        if (updateErr) throw updateErr;

        // Delete old items
        await supabase.from('sq_eval_items').delete().eq('evaluation_id', existing.id);
        evalId = existing.id;
      } else {
        // Insert new
        const { data: inserted, error: insertErr } = await supabase
          .from('sq_evaluations')
          .insert({
            evaluation_date: evaluation.evaluationDate,
            business_type: evaluation.businessType,
            company_name: evaluation.companyName,
            lead_company: evaluation.leadCompany,
            evaluator: evaluation.evaluator,
            total_score: evaluation.totalScore,
            max_score: evaluation.maxScore,
            grade: evaluation.grade,
            category_scores: evaluation.categoryScores,
          })
          .select('id')
          .single();
        if (insertErr) throw insertErr;
        evalId = inserted.id;
      }

      // Insert items
      if (parsedItems.length > 0) {
        const rows = parsedItems.map(it => ({
          evaluation_id: evalId,
          item_no: it.itemNo,
          category: it.category,
          sub_item: it.subItem,
          max_score: it.maxScore,
          compliance_status: it.complianceStatus,
          actual_score: it.actualScore,
          finding: it.finding,
          additional_finding: it.additionalFinding,
        }));
        const { error: itemErr } = await supabase.from('sq_eval_items').insert(rows);
        if (itemErr) throw itemErr;
      }

      setParsePreview(null);
      setSelectedEvalId(evalId);
      await loadEvaluations();
      await loadItems(evalId);
    } catch (err: any) {
      setUploadError(err.message || 'DB 저장에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // ===== Improvement CRUD =====
  const openImprovementForm = (item?: SQEvalItem) => {
    setEditingImpId(null);
    setImpFormData({
      evaluationId: selectedEvalId,
      itemNo: item?.itemNo || '',
      category: item?.category || '',
      issueDescription: item?.finding?.substring(0, 200) || '',
      improvementPlan: '',
      responsiblePerson: '',
      dueDate: '',
      status: '미착수',
    });
    setShowImpForm(true);
  };

  const editImprovement = (imp: SQImprovement) => {
    setEditingImpId(imp.id!);
    setImpFormData({ ...imp });
    setShowImpForm(true);
  };

  const saveImprovement = async () => {
    if (!impFormData.issueDescription) return;
    const row = {
      evaluation_id: impFormData.evaluationId || selectedEvalId,
      item_no: impFormData.itemNo || '',
      category: impFormData.category || '',
      issue_description: impFormData.issueDescription,
      improvement_plan: impFormData.improvementPlan || '',
      responsible_person: impFormData.responsiblePerson || '',
      due_date: impFormData.dueDate || null,
      status: impFormData.status || '미착수',
      completion_date: impFormData.completionDate || null,
      evidence: impFormData.evidence || '',
    };

    if (editingImpId) {
      await supabase.from('sq_improvements').update(row).eq('id', editingImpId);
    } else {
      await supabase.from('sq_improvements').insert(row);
    }
    setShowImpForm(false);
    loadImprovements(selectedEvalId);
  };

  const deleteImprovement = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await supabase.from('sq_improvements').delete().eq('id', id);
    loadImprovements(selectedEvalId);
  };

  const updateImpStatus = async (id: string, status: SQImprovementStatus) => {
    const updates: any = { status };
    if (status === '완료') updates.completion_date = new Date().toISOString().split('T')[0];
    await supabase.from('sq_improvements').update(updates).eq('id', id);
    loadImprovements(selectedEvalId);
  };

  // ===== Derived Data =====
  const deficientItems = items.filter(it =>
    it.actualScore === 0 ||
    ['미흡', '미관리', '다수미흡', '일부미흡', '보완'].includes(it.complianceStatus || '')
  ).sort((a, b) => (a.actualScore / Math.max(a.maxScore, 1)) - (b.actualScore / Math.max(b.maxScore, 1)));

  const radarData = (selectedEval?.categoryScores || []).map(cs => ({
    category: cs.category.replace('관리', '\n관리').replace('체제', '\n체제'),
    fullLabel: cs.category,
    득점률: cs.percentage,
    fullMark: 100,
  }));

  // Trend data: group evaluations by businessType, order by date
  const businessTypes = [...new Set(evaluations.map(e => e.businessType))];
  const trendData = evaluations
    .sort((a, b) => a.evaluationDate.localeCompare(b.evaluationDate))
    .reduce((acc: any[], ev) => {
      const key = ev.evaluationDate;
      let entry = acc.find(a => a.date === key);
      if (!entry) {
        entry = { date: key };
        acc.push(entry);
      }
      entry[ev.businessType] = ev.totalScore;
      return acc;
    }, []);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  // ===== Render =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">SQ 마크 평가 관리</h2>
        {evaluations.length > 0 && (
          <select
            className="border rounded px-3 py-1.5 text-sm"
            value={selectedEvalId}
            onChange={e => setSelectedEvalId(e.target.value)}
          >
            {evaluations.map(ev => (
              <option key={ev.id} value={ev.id}>
                [{ev.businessType}] {ev.evaluationDate} - {ev.totalScore}점 ({ev.grade}등급)
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Summary Cards */}
      {evaluations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Latest evaluations per business type */}
          {businessTypes.map(bt => {
            const latest = evaluations.find(e => e.businessType === bt);
            if (!latest) return null;
            const impCount = selectedEvalId === latest.id
              ? improvements.filter(i => i.status !== '완료').length
              : 0;
            return (
              <div
                key={bt}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 transition-colors ${selectedEvalId === latest.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}
                onClick={() => setSelectedEvalId(latest.id!)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">{bt}</span>
                  <span className={`px-2 py-0.5 rounded text-sm font-bold ${gradeColor(latest.grade)}`}>
                    {latest.grade}등급
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {latest.totalScore}<span className="text-sm text-gray-400">/{latest.maxScore}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {latest.evaluationDate} · {latest.leadCompany}
                </div>
              </div>
            );
          })}

          {/* Improvement summary */}
          {selectedEval && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-600 mb-2">개선활동 현황</div>
              <div className="flex gap-3 text-sm">
                <span className="text-gray-700">
                  미착수 <strong className="text-red-600">{improvements.filter(i => i.status === '미착수').length}</strong>
                </span>
                <span className="text-gray-700">
                  진행중 <strong className="text-blue-600">{improvements.filter(i => i.status === '진행중').length}</strong>
                </span>
                <span className="text-gray-700">
                  완료 <strong className="text-green-600">{improvements.filter(i => i.status === '완료').length}</strong>
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                미흡항목: {deficientItems.length}건
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts Row */}
      {selectedEval && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Radar Chart */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">카테고리별 득점률 (%)</h3>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="득점률" dataKey="득점률" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Tooltip formatter={(v: any) => [`${v}%`, '득점률']} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">데이터 없음</div>
            )}
          </div>

          {/* Score Trend or Bar Chart */}
          <div className="bg-white rounded-lg shadow p-4">
            {trendData.length > 1 ? (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">평가 점수 추이</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 1000]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    {businessTypes.map((bt, idx) => (
                      <Line key={bt} type="monotone" dataKey={bt} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">카테고리별 점수</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={(selectedEval.categoryScores || []).map(cs => ({
                    category: cs.category,
                    취득: cs.score,
                    미취득: cs.maxScore - cs.score,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="취득" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="미취득" stackId="a" fill="#e5e7eb" />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b flex">
          {SUB_TABS.map(tab => (
            <button
              key={tab}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${subTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setSubTab(tab)}
            >
              {tab}
              {tab === '미흡항목' && deficientItems.length > 0 && (
                <span className="ml-1 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">{deficientItems.length}</span>
              )}
              {tab === '개선활동' && improvements.length > 0 && (
                <span className="ml-1 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{improvements.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* 미흡항목 / 전체항목 */}
          {(subTab === '미흡항목' || subTab === '전체항목') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">{subTab}</span>
                <button onClick={itemsTable.toggleExpand} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  {itemsTable.expanded ? '접기 \u25B2' : '펼치기 \u25BC'}
                </button>
              </div>
              {itemsTable.expanded && (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <SortableHeader label="항목" sortKey="itemNo" sortConfig={itemsTable.sortConfig} onSort={itemsTable.requestSort} className="px-3 py-2 text-left w-16" />
                    <SortableHeader label="카테고리" sortKey="category" sortConfig={itemsTable.sortConfig} onSort={itemsTable.requestSort} className="px-3 py-2 text-left w-28" />
                    <SortableHeader label="배점" sortKey="maxScore" sortConfig={itemsTable.sortConfig} onSort={itemsTable.requestSort} className="px-3 py-2 text-center w-14" />
                    <th className="px-3 py-2 text-center w-20">이행상태</th>
                    <SortableHeader label="점수" sortKey="actualScore" sortConfig={itemsTable.sortConfig} onSort={itemsTable.requestSort} className="px-3 py-2 text-center w-14" />
                    <th className="px-3 py-2 text-left">지적사항</th>
                    <th className="px-3 py-2 text-center w-20">조치</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsTable.sortData(subTab === '미흡항목' ? deficientItems : items).map(item => (
                    <tr key={item.id || item.itemNo} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs">{item.itemNo}</td>
                      <td className="px-3 py-2 text-xs">{item.category}</td>
                      <td className="px-3 py-2 text-center">{item.maxScore}</td>
                      <td className={`px-3 py-2 text-center text-xs ${complianceColor(item.complianceStatus)}`}>
                        {item.complianceStatus || '-'}
                      </td>
                      <td className={`px-3 py-2 text-center font-bold ${item.actualScore === 0 ? 'text-red-600' : ''}`}>
                        {item.actualScore}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate" title={item.finding}>
                        {item.finding ? item.finding.substring(0, 100) + (item.finding.length > 100 ? '...' : '') : '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {(item.actualScore < item.maxScore) && (
                          <button
                            className="text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => { openImprovementForm(item); setSubTab('개선활동'); }}
                          >
                            개선등록
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(subTab === '미흡항목' ? deficientItems : items).length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">
                      {evaluations.length === 0 ? 'Excel 파일을 업로드해주세요' : '항목이 없습니다'}
                    </td></tr>
                  )}
                </tbody>
              </table>
              </div>
              )}
            </div>
          )}

          {/* 개선활동 */}
          {subTab === '개선활동' && (
            <div>
              <div className="flex justify-end mb-3">
                <button
                  className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700"
                  onClick={() => openImprovementForm()}
                >
                  + 개선활동 등록
                </button>
              </div>

              {/* Improvement Form Modal */}
              {showImpForm && (
                <div className="mb-4 border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-semibold text-sm mb-3">{editingImpId ? '개선활동 수정' : '개선활동 등록'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="block text-gray-600 mb-1">항목번호</label>
                      <input className="border rounded px-2 py-1 w-full" value={impFormData.itemNo || ''} onChange={e => setImpFormData(p => ({ ...p, itemNo: e.target.value }))} placeholder="예: 1_6" />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">카테고리</label>
                      <input className="border rounded px-2 py-1 w-full" value={impFormData.category || ''} onChange={e => setImpFormData(p => ({ ...p, category: e.target.value }))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-600 mb-1">지적사항 *</label>
                      <textarea className="border rounded px-2 py-1 w-full h-16" value={impFormData.issueDescription || ''} onChange={e => setImpFormData(p => ({ ...p, issueDescription: e.target.value }))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-600 mb-1">개선대책</label>
                      <textarea className="border rounded px-2 py-1 w-full h-16" value={impFormData.improvementPlan || ''} onChange={e => setImpFormData(p => ({ ...p, improvementPlan: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">담당자</label>
                      <input className="border rounded px-2 py-1 w-full" value={impFormData.responsiblePerson || ''} onChange={e => setImpFormData(p => ({ ...p, responsiblePerson: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">마감일</label>
                      <input type="date" className="border rounded px-2 py-1 w-full" value={impFormData.dueDate || ''} onChange={e => setImpFormData(p => ({ ...p, dueDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">상태</label>
                      <select className="border rounded px-2 py-1 w-full" value={impFormData.status || '미착수'} onChange={e => setImpFormData(p => ({ ...p, status: e.target.value as SQImprovementStatus }))}>
                        <option>미착수</option><option>진행중</option><option>완료</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">증빙 메모</label>
                      <input className="border rounded px-2 py-1 w-full" value={impFormData.evidence || ''} onChange={e => setImpFormData(p => ({ ...p, evidence: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700" onClick={saveImprovement}>저장</button>
                    <button className="bg-gray-200 text-gray-700 text-sm px-4 py-1.5 rounded hover:bg-gray-300" onClick={() => setShowImpForm(false)}>취소</button>
                  </div>
                </div>
              )}

              {/* Improvements Table */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">개선활동 목록</span>
                <button onClick={improvementsTable.toggleExpand} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  {improvementsTable.expanded ? '접기 \u25B2' : '펼치기 \u25BC'}
                </button>
              </div>
              {improvementsTable.expanded && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <SortableHeader label="항목" sortKey="itemNo" sortConfig={improvementsTable.sortConfig} onSort={improvementsTable.requestSort} className="px-3 py-2 text-left w-16" />
                    <th className="px-3 py-2 text-left">지적사항</th>
                    <th className="px-3 py-2 text-left">개선대책</th>
                    <SortableHeader label="담당자" sortKey="responsiblePerson" sortConfig={improvementsTable.sortConfig} onSort={improvementsTable.requestSort} className="px-3 py-2 text-center w-20" />
                    <SortableHeader label="마감일" sortKey="dueDate" sortConfig={improvementsTable.sortConfig} onSort={improvementsTable.requestSort} className="px-3 py-2 text-center w-24" />
                    <SortableHeader label="상태" sortKey="status" sortConfig={improvementsTable.sortConfig} onSort={improvementsTable.requestSort} className="px-3 py-2 text-center w-20" />
                    <th className="px-3 py-2 text-center w-24">조치</th>
                  </tr>
                </thead>
                <tbody>
                  {improvementsTable.sortData(improvements).map(imp => (
                    <tr key={imp.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs">{imp.itemNo}</td>
                      <td className="px-3 py-2 text-xs max-w-xs truncate" title={imp.issueDescription}>{imp.issueDescription.substring(0, 80)}</td>
                      <td className="px-3 py-2 text-xs max-w-xs truncate" title={imp.improvementPlan}>{imp.improvementPlan.substring(0, 80)}</td>
                      <td className="px-3 py-2 text-center text-xs">{imp.responsiblePerson}</td>
                      <td className="px-3 py-2 text-center text-xs">{imp.dueDate}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(imp.status)}`}>{imp.status}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          {imp.status !== '완료' && (
                            <button
                              className="text-xs text-green-600 hover:text-green-800"
                              onClick={() => updateImpStatus(imp.id!, imp.status === '미착수' ? '진행중' : '완료')}
                            >
                              {imp.status === '미착수' ? '착수' : '완료'}
                            </button>
                          )}
                          <button className="text-xs text-gray-500 hover:text-gray-700" onClick={() => editImprovement(imp)}>수정</button>
                          <button className="text-xs text-red-500 hover:text-red-700" onClick={() => deleteImprovement(imp.id!)}>삭제</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {improvements.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">등록된 개선활동이 없습니다</td></tr>
                  )}
                </tbody>
              </table>
              )}
            </div>
          )}

          {/* 평가이력 */}
          {subTab === '평가이력' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">평가이력</span>
                <button onClick={historyTable.toggleExpand} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  {historyTable.expanded ? '접기 \u25B2' : '펼치기 \u25BC'}
                </button>
              </div>
              {historyTable.expanded && (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <SortableHeader label="평가일" sortKey="evaluationDate" sortConfig={historyTable.sortConfig} onSort={historyTable.requestSort} className="px-3 py-2 text-left" />
                    <th className="px-3 py-2 text-left">업종</th>
                    <th className="px-3 py-2 text-left">주관장사</th>
                    <SortableHeader label="총점" sortKey="totalScore" sortConfig={historyTable.sortConfig} onSort={historyTable.requestSort} className="px-3 py-2 text-center" />
                    <SortableHeader label="등급" sortKey="grade" sortConfig={historyTable.sortConfig} onSort={historyTable.requestSort} className="px-3 py-2 text-center" />
                    <th className="px-3 py-2 text-left">카테고리별 득점률</th>
                    <th className="px-3 py-2 text-center">조치</th>
                  </tr>
                </thead>
                <tbody>
                  {historyTable.sortData(evaluations).map(ev => (
                    <tr key={ev.id} className={`border-b hover:bg-gray-50 cursor-pointer ${ev.id === selectedEvalId ? 'bg-blue-50' : ''}`} onClick={() => setSelectedEvalId(ev.id!)}>
                      <td className="px-3 py-2">{ev.evaluationDate}</td>
                      <td className="px-3 py-2">{ev.businessType}</td>
                      <td className="px-3 py-2">{ev.leadCompany}</td>
                      <td className="px-3 py-2 text-center font-bold">{ev.totalScore}<span className="text-gray-400 font-normal">/{ev.maxScore}</span></td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${gradeColor(ev.grade)}`}>{ev.grade}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 flex-wrap">
                          {(ev.categoryScores || []).map(cs => (
                            <span key={cs.category} className={`text-xs px-1.5 py-0.5 rounded ${cs.percentage >= 70 ? 'bg-green-100 text-green-700' : cs.percentage >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {cs.category.substring(0, 4)} {cs.percentage}%
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          className="text-xs text-red-500 hover:text-red-700"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm(`${ev.businessType} (${ev.evaluationDate}) 평가를 삭제하시겠습니까?`)) return;
                            await supabase.from('sq_evaluations').delete().eq('id', ev.id);
                            loadEvaluations();
                          }}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                  {evaluations.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">등록된 평가가 없습니다. Excel 파일을 업로드해주세요.</td></tr>
                  )}
                </tbody>
              </table>
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">SQ 평가서 업로드</h3>

        {/* Upload Preview */}
        {parsePreview ? (
          <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
            <h4 className="font-semibold text-sm text-blue-800 mb-2">파싱 결과 미리보기</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
              <div><span className="text-gray-500">업종:</span> <strong>{parsePreview.evaluation.businessType}</strong></div>
              <div><span className="text-gray-500">평가일:</span> <strong>{parsePreview.evaluation.evaluationDate}</strong></div>
              <div><span className="text-gray-500">총점:</span> <strong>{parsePreview.evaluation.totalScore}/{parsePreview.evaluation.maxScore}</strong></div>
              <div><span className="text-gray-500">등급:</span> <strong className={gradeColor(parsePreview.evaluation.grade).split(' ')[0]}>{parsePreview.evaluation.grade}</strong></div>
              <div><span className="text-gray-500">협력사:</span> {parsePreview.evaluation.companyName}</div>
              <div><span className="text-gray-500">주관장사:</span> {parsePreview.evaluation.leadCompany}</div>
              <div><span className="text-gray-500">평가자:</span> {parsePreview.evaluation.evaluator}</div>
              <div><span className="text-gray-500">항목수:</span> {parsePreview.items.length}개</div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {(parsePreview.evaluation.categoryScores || []).map(cs => (
                <span key={cs.category} className="text-xs bg-white border rounded px-2 py-1">
                  {cs.category}: {cs.score}/{cs.maxScore} ({cs.percentage}%)
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={confirmUpload}
                disabled={uploading}
              >
                {uploading ? '저장 중...' : 'DB에 저장'}
              </button>
              <button
                className="bg-gray-200 text-gray-700 text-sm px-4 py-1.5 rounded hover:bg-gray-300"
                onClick={() => setParsePreview(null)}
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-3xl mb-2">📁</div>
            <p className="text-gray-600 text-sm">SQ 평가서 Excel 파일을 드래그하거나 클릭하여 업로드</p>
            <p className="text-gray-400 text-xs mt-1">지원 형식: .xlsx (HKMC SQ 마크 평가서 Ver5.1)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        )}

        {uploadError && (
          <div className="mt-3 bg-red-50 text-red-700 px-4 py-2 rounded text-sm">
            {uploadError}
          </div>
        )}
      </div>
    </div>
  );
};

export default SQEvaluation;
