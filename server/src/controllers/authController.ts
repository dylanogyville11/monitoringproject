import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { createAuthClient, supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest, Profile } from '../types';
import { successResponse, errorResponse } from '../utils/responseHelper';
import { logAudit } from '../services/auditService';

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const INVALID_CREDENTIALS = 'Username atau password salah.';

/**
 * POST /api/auth/login — login dengan username (atau email) dan password.
 */
export async function login(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);
    const identifier = body.username.toLowerCase();

    let email: string | null = identifier.includes('@') ? identifier : null;
    let profile: Profile | null = null;

    if (!email) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('username', identifier)
        .maybeSingle<Profile>();
      profile = data;
      if (!profile) {
        errorResponse(res, INVALID_CREDENTIALS, 401);
        return;
      }
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      email = authUser.user?.email ?? null;
    }

    if (!email) {
      errorResponse(res, INVALID_CREDENTIALS, 401);
      return;
    }

    const authClient = createAuthClient();
    const { data: session, error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password: body.password,
    });

    if (signInError || !session.session || !session.user) {
      errorResponse(res, INVALID_CREDENTIALS, 401);
      return;
    }

    if (!profile) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle<Profile>();
      profile = data;
    }

    if (!profile) {
      errorResponse(res, 'Profil pengguna tidak ditemukan.', 401);
      return;
    }

    if (!profile.is_active) {
      errorResponse(res, 'Akun tidak aktif. Hubungi administrator.', 403);
      return;
    }

    await logAudit(null, profile, 'Login ke sistem', { username: profile.username });

    successResponse(
      res,
      {
        token: session.session.access_token,
        refresh_token: session.session.refresh_token,
        expires_at: session.session.expires_at,
        user: profile,
      },
      'Login berhasil',
    );
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me — profil pengguna saat ini.
 */
export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    successResponse(res, req.user, 'Data profil berhasil diambil.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout — mencabut sesi pengguna di Supabase.
 */
export async function logout(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.headers.authorization?.slice('Bearer '.length).trim();
    if (token) {
      await supabaseAdmin.auth.admin.signOut(token).catch(() => undefined);
    }
    successResponse(res, null, 'Logout berhasil.');
  } catch (err) {
    next(err);
  }
}
