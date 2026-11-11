import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: SUPABASE_URL');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
} as const;

/**
 * Supabase admin client (service role). Bypass RLS — JANGAN pernah diekspos ke frontend.
 * Jangan gunakan client ini untuk signIn agar header Authorization tetap service role.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  clientOptions,
);

/**
 * Membuat client sekali pakai untuk operasi sign-in pengguna,
 * sehingga sesi pengguna tidak mencemari client admin.
 */
export function createAuthClient(): SupabaseClient {
  const key = process.env.SUPABASE_ANON_KEY || supabaseServiceRoleKey!;
  return createClient(supabaseUrl!, key, clientOptions);
}
