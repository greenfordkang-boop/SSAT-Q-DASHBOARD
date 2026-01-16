
import { createClient } from '@supabase/supabase-js';

// 기본값: 사용자가 제공한 값 (Fallbacks)
const DEFAULT_URL = 'https://xjjsqyawvojybuyrehrr.supabase.co';
// 수정됨: 오타 수정 (voOpc -> vo0pc)
const DEFAULT_KEY = 'sb_publishable_vvaBbJHvo0pcUwaUiPW0ww_vElHC7GW';

// 저장소 키 (App.tsx와 공유하기 위해 export)
export const STORAGE_KEY_URL = 'supabase_url_v6';
export const STORAGE_KEY_KEY = 'supabase_key_v6';

export const getSupabase = () => {
  let url = DEFAULT_URL;
  let key = DEFAULT_KEY;
  let isCustom = false;

  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem(STORAGE_KEY_URL);
    const storedKey = localStorage.getItem(STORAGE_KEY_KEY);
    
    // URL 유효성 검사 (공백 제거 및 https 확인)
    if (storedUrl && storedUrl.trim().startsWith('https://')) {
      url = storedUrl.trim();
      isCustom = true;
    }
    if (storedKey && storedKey.trim().length > 0) {
      key = storedKey.trim();
    }
  }

  // 디버깅을 위한 로그 (실제 배포 시에는 제거 가능)
  if (isCustom) {
    console.log(`[Supabase] Initializing with custom URL: ${url}`);
  } else {
    console.log(`[Supabase] Initializing with DEFAULT URL`);
  }

  try {
    return createClient(url, key);
  } catch (error) {
    console.error("Supabase Client Initialization Failed:", error);
    // 초기화 실패 시에도 앱이 멈추지 않도록 기본값으로 생성 시도
    return createClient(DEFAULT_URL, DEFAULT_KEY);
  }
};

// 싱글톤 인스턴스 Export
// 주의: 이 인스턴스는 모듈이 처음 로드될 때 한 번만 생성됩니다.
// 설정을 변경하면 반드시 window.location.reload()가 필요합니다.
export const supabase = getSupabase();

export const saveSupabaseConfig = (newUrl: string, newKey: string) => {
  const cleanUrl = newUrl.trim();
  const cleanKey = newKey.trim();

  if (!cleanUrl.startsWith('https://')) {
    alert('유효하지 않은 URL입니다. https:// 로 시작해야 합니다.');
    return;
  }
  
  // 저장
  localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
  localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
  
  // 중요: 싱글톤 인스턴스를 갱신하기 위해 페이지를 강제로 새로고침합니다.
  alert('설정이 저장되었습니다. 시스템을 재시작합니다.');
  window.location.reload(); 
};

export const resetSupabaseConfig = () => {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  alert('설정이 초기화되었습니다. 시스템을 재시작합니다.');
  window.location.reload();
};
