import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { errorResponse } from '../utils/responseHelper';

/**
 * Middleware factory that restricts access to users with specific roles.
 * Must be used AFTER authMiddleware.
 *
 * @param roles - Array of allowed user roles
 */
export function requireRole(roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Tidak terautentikasi.', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      errorResponse(
        res,
        `Akses ditolak. Diperlukan role: ${roles.join(' atau ')}.`,
        403,
      );
      return;
    }

    next();
  };
}
