
import { createClient } from '@supabase/supabase-js';

// 기본값: 사용자가 제공한 값 적용
const DEFAULT_URL = 'https://xjjsqyawvojybuyrehrr.supabase.co';
// 제공된 Publishable API Key 적용
const DEFAULT_KEY = 'sb_publishable_vvaBbJHvoOpcUwaUiPW0ww_vElHC7GW';

// 저장소 키 (v5 사용 - 기존 캐시 무효화 및 새 기본값 적용)
const STORAGE_KEY_URL = 'supabase_url_v5';
const STORAGE_KEY_KEY = 'supabase_key_v5';

export const getSupabase = () => {
  let url = DEFAULT_URL;
  let key = DEFAULT_KEY;

  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem(STORAGE_KEY_URL);
    const storedKey = localStorage.getItem(STORAGE_KEY_KEY);
    
    // 간단한 URL 유효성 검사 및 공백 제거
    if (storedUrl && storedUrl.trim().startsWith('http')) {
      url = storedUrl.trim();
    }
    if (storedKey && storedKey.trim().length > 0) {
      key = storedKey.trim();
    }
  }

  try {
    return createClient(url, key);
  } catch (error) {
    console.error("Supabase Client Initialization Failed:", error);
    // 초기화 실패 시 기본값으로 재시도하거나 안전한 상태 유지
    return createClient(DEFAULT_URL, DEFAULT_KEY);
  }
};

// 기존 코드와의 호환성을 위해 export
export const supabase = getSupabase();

export const saveSupabaseConfig = (newUrl: string, newKey: string) => {
  const cleanUrl = newUrl.trim();
  const cleanKey = newKey.trim();

  if (!cleanUrl.startsWith('http')) {
    alert('유효하지 않은 URL입니다. https:// 로 시작해야 합니다.');
    return;
  }
  
  localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
  localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
  
  // 새로고침하여 설정 적용 (루트 경로로 이동하여 404 방지)
  window.location.href = '/'; 
};

export const resetSupabaseConfig = () => {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  window.location.href = '/';
};
