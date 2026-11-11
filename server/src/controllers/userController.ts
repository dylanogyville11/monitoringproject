import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest, Profile } from '../types';
import { successResponse, errorResponse } from '../utils/responseHelper';
import { logAudit } from '../services/auditService';

const roleEnum = z.enum(['admin', 'operator', 'pimpinan']);

const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Username minimal 3 karakter')
    .max(50)
    .regex(/^[a-z0-9._-]+$/, 'Username hanya boleh huruf kecil, angka, titik, strip, dan underscore'),
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  name: z.string().trim().min(1, 'Nama wajib diisi').max(150),
  nip: z.string().max(50).nullable().optional(),
  role: roleEnum,
  jabatan: z.string().max(150).nullable().optional(),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  nip: z.string().max(50).nullable().optional(),
  role: roleEnum.optional(),
  jabatan: z.string().max(150).nullable().optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
});

/**
 * GET /api/users — daftar seluruh pengguna (admin).
 */
export async function getUsers(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      errorResponse(res, `Gagal mengambil data pengguna: ${error.message}`, 500);
      return;
    }

    successResponse(res, (data ?? []) as Profile[], 'Data pengguna berhasil diambil.');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/:id — detail pengguna (admin).
 */
export async function getUserById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle<Profile>();

    if (error || !data) {
      errorResponse(res, 'Pengguna tidak ditemukan.', 404);
      return;
    }

    successResponse(res, data, 'Data pengguna berhasil diambil.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users — buat akun pengguna baru (admin).
 */
export async function createUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = createUserSchema.parse(req.body);

    const { data: exists } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', body.username)
      .maybeSingle();
    if (exists) {
      errorResponse(res, 'Username sudah digunakan.', 409);
      return;
    }

    const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { username: body.username, name: body.name, role: body.role },
    });

    if (authError || !created.user) {
      errorResponse(res, `Gagal membuat akun: ${authError?.message}`, 400);
      return;
    }

    // Trigger handle_new_user membuat profil dasar; lengkapi datanya (upsert untuk keamanan)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: created.user.id,
        username: body.username,
        name: body.name,
        nip: body.nip ?? null,
        role: body.role,
        jabatan: body.jabatan ?? null,
        is_active: true,
      })
      .select('*')
      .single<Profile>();

    if (profileError || !profile) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      errorResponse(res, `Gagal menyimpan profil: ${profileError?.message}`, 500);
      return;
    }

    await logAudit(null, req.user, `Membuat akun pengguna "${profile.username}"`, {
      target_user_id: profile.id,
      role: profile.role,
    });

    successResponse(res, profile, 'Pengguna berhasil dibuat.', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/:id — ubah role, status aktif, profil, atau reset password (admin).
 */
export async function updateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const { password, ...profileUpdate } = updateUserSchema.parse(req.body);

    if (id === req.user.id && (profileUpdate.is_active === false || (profileUpdate.role && profileUpdate.role !== 'admin'))) {
      errorResponse(res, 'Anda tidak dapat menonaktifkan atau menurunkan role akun Anda sendiri.', 400);
      return;
    }

    if (password) {
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
      if (pwError) {
        errorResponse(res, `Gagal mengubah password: ${pwError.message}`, 400);
        return;
      }
    }

    let profile: Profile | null = null;
    if (Object.keys(profileUpdate).length > 0) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', id)
        .select('*')
        .maybeSingle<Profile>();
      if (error) {
        errorResponse(res, `Gagal memperbarui pengguna: ${error.message}`, 500);
        return;
      }
      profile = data;
    } else {
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', id).maybeSingle<Profile>();
      profile = data;
    }

    if (!profile) {
      errorResponse(res, 'Pengguna tidak ditemukan.', 404);
      return;
    }

    await logAudit(null, req.user, `Memperbarui akun pengguna "${profile.username}"`, {
      target_user_id: id,
      changes: profileUpdate,
      password_reset: Boolean(password),
    });

    successResponse(res, profile, 'Data pengguna berhasil diperbarui.');
  } catch (err) {
    next(err);
  }
}
