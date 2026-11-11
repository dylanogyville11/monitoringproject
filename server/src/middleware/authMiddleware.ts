import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest, Profile } from '../types';
import { errorResponse } from '../utils/responseHelper';

/**
 * Verifikasi Supabase JWT dari header `Authorization: Bearer <token>`.
 * Menyuntikkan profil pengguna ke `req.user`.
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      errorResponse(res, 'Token autentikasi tidak ditemukan.', 401);
      return;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      errorResponse(res, 'Token autentikasi tidak valid.', 401);
      return;
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      errorResponse(res, 'Token tidak valid atau sudah kedaluwarsa.', 401);
      return;
    }

    // profiles.id = auth.users.id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single<Profile>();

    if (profileError || !profile) {
      errorResponse(res, 'Profil pengguna tidak ditemukan.', 401);
      return;
    }

    if (!profile.is_active) {
      errorResponse(res, 'Akun pengguna tidak aktif.', 403);
      return;
    }

    req.user = profile;
    next();
  } catch (err) {
    next(err);
  }
}
