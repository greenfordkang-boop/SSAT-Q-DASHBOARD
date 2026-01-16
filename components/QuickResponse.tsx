
import React, { useState } from 'react';
import { QuickResponseEntry, ResponseStatus } from '../types';

interface QuickResponseProps {
  data: QuickResponseEntry[];
  onSave: (entry: QuickResponseEntry) => void;
  onDelete: (id: string) => void;
}

const QuickResponse: React.FC<QuickResponseProps> = ({ data, onSave, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<QuickResponseEntry | null>(null);
  const [formData, setFormData] = useState<Partial<QuickResponseEntry>>({
    date: new Date().toISOString().split('T')[0],
    department: 'LG전자',
    machineNo: '',
    defectCount: 0,
    model: '',
    defectType: '',
    process: '',
    defectContent: '',
    coating: '',
    area: '',
    materialCode: '',
    shielding: '',
    action: '',
    materialManager: '',
    meetingAttendance: '',
    status24H: 'N/A',
    status3D: 'N/A',
    status14DAY: 'N/A',
    status24D: 'N/A',
    status25D: 'N/A',
    status30D: 'N/A',
    customerMM: '',
    remarks: ''
  });

  const handleEdit = (entry: QuickResponseEntry) => {
    setEditingEntry(entry);
    setFormData(entry);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingEntry(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      department: 'LG전자',
      machineNo: '',
      defectCount: 0,
      model: '',
      defectType: '',
      process: '',
      defectContent: '',
      coating: '',
      area: '',
      materialCode: '',
      shielding: '',
      action: '',
      materialManager: '',
      meetingAttendance: '',
      status24H: 'N/A',
      status3D: 'N/A',
      status14DAY: 'N/A',
      status24D: 'N/A',
      status25D: 'N/A',
      status30D: 'N/A',
      customerMM: '',
      remarks: ''
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department || !formData.model) {
      alert('부서와 모델명은 필수입니다.');
      return;
    }
    onSave(formData as QuickResponseEntry);
    setShowForm(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'defectCount' ? Number(value) : value
    }));
  };

  const getStatusBadge = (status: ResponseStatus) => {
    const styles = {
      'G': 'bg-emerald-100 text-emerald-700 border-emerald-300',
      'R': 'bg-rose-100 text-rose-700 border-rose-300',
      'Y': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'N/A': 'bg-slate-100 text-slate-500 border-slate-300'
    };
    return (
      <span className={`px-2 py-1 rounded-lg border text-[10px] font-black ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-800">신속대응 추적표</h2>
          <p className="text-xs text-slate-500 mt-1">불량 발생 후 각 단계별 대응 상태를 관리합니다</p>
        </div>
        <button
          onClick={handleNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg"
        >
          신규 등록
        </button>
      </div>

      {/* 평가기준 범례 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-600 mb-3">매체기준 상태기준</h3>
        <div className="grid grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-500 rounded flex items-center justify-center text-white font-black">R</div>
            <span className="text-slate-700">1) 조치사항 미실시<br/>2) 목표문서 조과</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center text-white font-black">Y</div>
            <span className="text-slate-700">실시중/요청 미로료</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-white font-black">G</div>
            <span className="text-slate-700">완료</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-400 rounded flex items-center justify-center text-white font-black">N/A</div>
            <span className="text-slate-700">해당사항없음</span>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr>
                <th className="px-3 py-3 text-left font-black text-slate-700">NO</th>
                <th className="px-3 py-3 text-left font-black text-slate-700">일자</th>
                <th className="px-3 py-3 text-left font-black text-slate-700">부서</th>
                <th className="px-3 py-3 text-left font-black text-slate-700">호기</th>
                <th className="px-3 py-3 text-left font-black text-slate-700">불량수</th>
                <th className="px-3 py-3 text-left font-black text-slate-700">모델명</th>
                <th className="px-3 py-3 text-left font-black text-slate-700">불량</th>
                <th className="px-3 py-3 text-left font-black text-slate-700">공정</th>
                <th className="px-3 py-3 text-left font-black text-slate-700 bg-emerald-50">24H</th>
                <th className="px-3 py-3 text-left font-black text-slate-700 bg-blue-50">3D</th>
                <th className="px-3 py-3 text-left font-black text-slate-700 bg-blue-50">14DAY</th>
                <th className="px-3 py-3 text-left font-black text-slate-700 bg-rose-50">24D</th>
                <th className="px-3 py-3 text-left font-black text-slate-700 bg-rose-50">25D</th>
                <th className="px-3 py-3 text-left font-black text-slate-700 bg-rose-50">30D</th>
                <th className="px-3 py-3 text-center font-black text-slate-700">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-12 text-center text-slate-400">
                    등록된 신속대응 추적 데이터가 없습니다
                  </td>
                </tr>
              ) : (
                data.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3 font-bold text-slate-600">{index + 1}</td>
                    <td className="px-3 py-3 text-slate-700">{entry.date}</td>
                    <td className="px-3 py-3 font-bold text-slate-800">{entry.department}</td>
                    <td className="px-3 py-3 text-slate-700">{entry.machineNo}</td>
                    <td className="px-3 py-3 text-rose-600 font-bold">{entry.defectCount}</td>
                    <td className="px-3 py-3 text-slate-700">{entry.model}</td>
                    <td className="px-3 py-3 text-slate-700">{entry.defectType}</td>
                    <td className="px-3 py-3 text-slate-700">{entry.process}</td>
                    <td className="px-3 py-3 bg-emerald-50">{getStatusBadge(entry.status24H)}</td>
                    <td className="px-3 py-3 bg-blue-50">{getStatusBadge(entry.status3D)}</td>
                    <td className="px-3 py-3 bg-blue-50">{getStatusBadge(entry.status14DAY)}</td>
                    <td className="px-3 py-3 bg-rose-50">{getStatusBadge(entry.status24D)}</td>
                    <td className="px-3 py-3 bg-rose-50">{getStatusBadge(entry.status25D)}</td>
                    <td className="px-3 py-3 bg-rose-50">{getStatusBadge(entry.status30D)}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (entry.id && window.confirm('삭제하시겠습니까?')) {
                              onDelete(entry.id);
                            }
                          }}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 입력 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  {editingEntry ? '신속대응 수정' : '신속대응 등록'}
                </h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 기본 정보 */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">발생일자</label>
                  <input
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">부서</label>
                  <input
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm font-bold"
                    placeholder="LG전자"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">호기</label>
                  <input
                    name="machineNo"
                    value={formData.machineNo}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                    placeholder="5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">불량수</label>
                  <input
                    name="defectCount"
                    type="number"
                    value={formData.defectCount}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">모델명</label>
                  <input
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                    placeholder="AX EV"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">불량</label>
                  <input
                    name="defectType"
                    value={formData.defectType}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">공정</label>
                  <input
                    name="process"
                    value={formData.process}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                    placeholder="COVER REAR"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">코팅</label>
                  <input
                    name="coating"
                    value={formData.coating}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">부위</label>
                  <input
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">재료코드</label>
                  <input
                    name="materialCode"
                    value={formData.materialCode}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">차폐</label>
                  <input
                    name="shielding"
                    value={formData.shielding}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">조치</label>
                  <input
                    name="action"
                    value={formData.action}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">자재담당자</label>
                  <input
                    name="materialManager"
                    value={formData.materialManager}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">지적회의 참석</label>
                  <input
                    name="meetingAttendance"
                    value={formData.meetingAttendance}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">고객 MM</label>
                  <input
                    name="customerMM"
                    value={formData.customerMM}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl text-sm"
                  />
                </div>

                {/* 상태 정보 */}
                <div className="md:col-span-3 mt-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b">목표달성 & 완료(GREEN)별 상태</h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">24H</label>
                      <select
                        name="status24H"
                        value={formData.status24H}
                        onChange={handleChange}
                        className="w-full border p-2.5 rounded-xl text-sm font-bold"
                      >
                        <option value="G">G (완료)</option>
                        <option value="R">R (지연)</option>
                        <option value="Y">Y (진행중)</option>
                        <option value="N/A">N/A (해당없음)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">3D</label>
                      <select
                        name="status3D"
                        value={formData.status3D}
                        onChange={handleChange}
                        className="w-full border p-2.5 rounded-xl text-sm font-bold"
                      >
                        <option value="G">G (완료)</option>
                        <option value="R">R (지연)</option>
                        <option value="Y">Y (진행중)</option>
                        <option value="N/A">N/A (해당없음)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">14DAY</label>
                      <select
                        name="status14DAY"
                        value={formData.status14DAY}
                        onChange={handleChange}
                        className="w-full border p-2.5 rounded-xl text-sm font-bold"
                      >
                        <option value="G">G (완료)</option>
                        <option value="R">R (지연)</option>
                        <option value="Y">Y (진행중)</option>
                        <option value="N/A">N/A (해당없음)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">24D</label>
                      <select
                        name="status24D"
                        value={formData.status24D}
                        onChange={handleChange}
                        className="w-full border p-2.5 rounded-xl text-sm font-bold"
                      >
                        <option value="G">G (완료)</option>
                        <option value="R">R (지연)</option>
                        <option value="Y">Y (진행중)</option>
                        <option value="N/A">N/A (해당없음)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">25D</label>
                      <select
                        name="status25D"
                        value={formData.status25D}
                        onChange={handleChange}
                        className="w-full border p-2.5 rounded-xl text-sm font-bold"
                      >
                        <option value="G">G (완료)</option>
                        <option value="R">R (지연)</option>
                        <option value="Y">Y (진행중)</option>
                        <option value="N/A">N/A (해당없음)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">30D</label>
                      <select
                        name="status30D"
                        value={formData.status30D}
                        onChange={handleChange}
                        className="w-full border p-2.5 rounded-xl text-sm font-bold"
                      >
                        <option value="G">G (완료)</option>
                        <option value="R">R (지연)</option>
                        <option value="Y">Y (진행중)</option>
                        <option value="N/A">N/A (해당없음)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">불량내용</label>
                  <textarea
                    name="defectContent"
                    value={formData.defectContent}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border p-3 rounded-xl text-sm outline-none resize-none"
                  />
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">비고</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows={2}
                    className="w-full border p-3 rounded-xl text-sm outline-none resize-none"
                  />
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-8 py-2.5 border rounded-xl font-bold text-slate-500 text-sm"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="px-12 py-2.5 bg-blue-600 text-white rounded-xl font-black shadow-lg text-sm"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickResponse;
