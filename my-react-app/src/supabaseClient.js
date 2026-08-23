import { createClient } from '@supabase/supabase-js'

// Load from environment or localStorage for in-browser configuration
export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('ttt_supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('ttt_supabase_anon_key') : null;

  const url = localUrl || (envUrl && !envUrl.includes('your-project-id') ? envUrl : '');
  const key = localKey || (envKey && !envKey.includes('your-anon-key') ? envKey : '');

  return { url, key };
}

export function saveSupabaseConfig(url, key) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ttt_supabase_url', url.trim());
    localStorage.setItem('ttt_supabase_anon_key', key.trim());
  }
}

export function isSupabaseConfigured() {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url.startsWith('http') && key.length > 20);
}

// Create Supabase client singleton
let supabaseInstance = null;

export function getSupabase() {
  const { url, key } = getSupabaseConfig();
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance || supabaseInstance.supabaseUrl !== url) {
    supabaseInstance = createClient(url, key, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return supabaseInstance;
}

// Generate persistent unique player ID for device
export function getDeviceId() {
  if (typeof window === 'undefined') return 'device_' + Math.random().toString(36).substring(2, 9);
  let id = localStorage.getItem('ttt_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem('ttt_device_id', id);
  }
  return id;
}

// Generate a random 6-character room code (e.g. TAC-729)
export function generateRoomCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  let code = 'TAC-';
  for (let i = 0; i < 3; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
}
