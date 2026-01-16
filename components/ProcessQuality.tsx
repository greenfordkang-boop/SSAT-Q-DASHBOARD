
import React, { useState, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ProcessData {
  name: string;
  사출: number;
  도장: number;
  조립: number;
}

const initialData: ProcessData[] = [
  { name: '1월', 사출: 450, 도장: 1200, 조립: 320 },
  { name: '2월', 사출: 380, 도장: 1100, 조립: 280 },
  { name: '3월', 사출: 420, 도장: 1350, 조립: 410 },
  { name: '4월', 사출: 310, 도장: 1050, 조립: 190 },
  { name: '5월', 사출: 290, 도장: 980, 조립: 210 },
  { name: '6월', 사출: 350, 도장: 1150, 조립: 240 },
];

const ProcessQuality: React.FC = () => {
  const [data, setData] = useState<ProcessData[]>(initialData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasApiKey = !!import.meta.env.VITE_GEMINI_API_KEY;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsAnalyzing(true);

    try {
      // Read file content
      const fileContent = await file.text();

      // Get API key
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setIsAnalyzing(false);
        alert('⚠️ Gemini API 키가 설정되지 않았습니다.\n\n📋 설정 방법:\n\n1. Vercel 대시보드 접속\n2. Settings → Environment Variables\n3. 변수 추가:\n   - Name: VITE_GEMINI_API_KEY\n   - Value: 본인의 Gemini API 키\n   - Environments: Production, Preview, Development 체크\n4. 저장 후 Deployments에서 Redeploy 클릭\n\n🔑 API 키 발급: https://makersuite.google.com/app/apikey');
        return;
      }

      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      // Create prompt for AI analysis
      const prompt = `당신은 제조업 품질 관리 전문가입니다. 다음은 MES 시스템에서 추출한 공정별 주간 실적 데이터입니다.

파일 내용:
${fileContent}

위 데이터를 분석하여 다음 세 가지 공정의 월별 PPM(불량률) 데이터를 추출해주세요:
1. 사출 (Injection Molding)
2. 도장 (Painting)
3. 조립 (Assembly)

응답은 반드시 아래의 JSON 형식으로만 제공해주세요. 다른 설명 없이 JSON만 반환하세요:

{
  "processData": [
    { "name": "1월", "사출": 450, "도장": 1200, "조립": 320 },
    { "name": "2월", "사출": 380, "도장": 1100, "조립": 280 }
  ]
}

주의사항:
- 각 월의 name 필드는 "N월" 형식으로 작성
- 사출, 도장, 조립 값은 PPM 단위의 숫자
- 데이터가 없는 월은 0으로 표시
- 최대 12개월 데이터를 추출`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse AI response
      let parsedData: ProcessData[];
      try {
        // Try to extract JSON from response (in case AI adds extra text)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          parsedData = parsed.processData || [];
        } else {
          throw new Error('JSON not found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', text);
        alert('AI 분석 결과를 파싱하는데 실패했습니다. 다시 시도해주세요.');
        setIsAnalyzing(false);
        return;
      }

      // Validate and update data
      if (parsedData && parsedData.length > 0) {
        setData(parsedData);
        alert(`✅ AI 분석 완료!\n${parsedData.length}개월 데이터가 추출되었습니다.`);
      } else {
        alert('분석된 데이터가 없습니다. 파일 형식을 확인해주세요.');
      }

    } catch (error: any) {
      console.error('File analysis error:', error);
      alert(`분석 중 오류가 발생했습니다:\n${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsAnalyzing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
        <div className={`bg-blue-50 p-6 rounded-full mb-4 ${isAnalyzing ? 'animate-pulse' : ''}`}>
          {isAnalyzing ? (
            <svg className="w-10 h-10 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-2">
          {isAnalyzing ? 'AI 분석 진행 중...' : 'MES 주간 실적 데이터 업로드'}
        </h3>
        <p className="text-slate-500 text-sm mb-4 max-w-md">
          {isAnalyzing
            ? 'Gemini AI가 데이터를 분석하고 있습니다. 잠시만 기다려주세요...'
            : '엑셀(CSV) 자료를 업로드하면 자동으로 사출, 도장, 조립 공정의 품질 지표를 분석하여 그래프로 표시합니다.'
          }
        </p>

        {/* API 키 상태 표시 */}
        <div className={`mb-4 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
          hasApiKey
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {hasApiKey ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Gemini AI 활성화됨 - 파일 분석 가능</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>API 키 미설정 - Vercel 환경 변수에서 VITE_GEMINI_API_KEY 추가 필요</span>
            </>
          )}
        </div>

        {uploadedFileName && !isAnalyzing && (
          <div className="mb-4 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            마지막 분석: {uploadedFileName}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={handleButtonClick}
          disabled={isAnalyzing}
          className={`px-8 py-3 rounded-2xl font-black shadow-lg transition-all ${
            isAnalyzing
              ? 'bg-slate-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }`}
        >
          {isAnalyzing ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              분석 중...
            </span>
          ) : (
            '파일 선택 및 AI 분석 시작'
          )}
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-6 flex justify-between">
          <span>공정별 품질 추이 분석 (ppm)</span>
          <div className="flex gap-4 text-[10px]">
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> 사출</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded-full"></div> 도장</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> 조립</span>
          </div>
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
              <Line type="monotone" dataKey="사출" stroke="#3b82f6" strokeWidth={3} dot={{r: 5}} />
              <Line type="monotone" dataKey="도장" stroke="#f43f5e" strokeWidth={3} dot={{r: 5}} />
              <Line type="monotone" dataKey="조립" stroke="#10b981" strokeWidth={3} dot={{r: 5}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProcessQuality;
