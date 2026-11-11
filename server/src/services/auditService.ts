import { supabaseAdmin } from '../config/supabase';
import { Profile } from '../types';

/**
 * Mencatat entri jejak audit ke tabel `audit_logs`.
 * Kegagalan pencatatan tidak menggagalkan request utama.
 */
export async function logAudit(
  jobId: string | null,
  user: Pick<Profile, 'id' | 'name'>,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabaseAdmin.from('audit_logs').insert({
    job_id: jobId,
    user_id: user.id,
    user_name: user.name,
    action,
    metadata: metadata ?? null,
  });

  if (error) {
    console.error('[AUDIT LOG ERROR]', error.message);
  }
}
