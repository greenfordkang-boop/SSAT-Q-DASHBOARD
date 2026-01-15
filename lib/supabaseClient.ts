
import { createClient } from '@supabase/supabase-js';

/**
 * 제공해주신 Supabase 프로젝트 정보를 상수로 등록하였습니다.
 * 프로젝트 URL: https://foiigsfabajyakbbxwdh.supabase.co
 * API Key: sb_publishable_C3pLWeHnq7poFzD-t_UVtA_LeJ8lXdm
 */
const supabaseUrl = 'https://foiigsfabajyakbbxwdh.supabase.co';
const supabaseAnonKey = 'sb_publishable_C3pLWeHnq7poFzD-t_UVtA_LeJ8lXdm';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
