import { Router, RequestHandler } from 'express';
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  createJobNote,
  getJobAuditLogs,
  getJobProgress,
} from '../controllers/jobController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleGuard';

const router = Router();

// All job routes require authentication
router.use(authMiddleware as unknown as RequestHandler);

/** GET /api/jobs - All roles */
router.get('/', getJobs as unknown as RequestHandler);

/** GET /api/jobs/:id - All roles */
router.get('/:id', getJobById as unknown as RequestHandler);

/** GET /api/jobs/:id/progress - All roles */
router.get('/:id/progress', getJobProgress as unknown as RequestHandler);

/** GET /api/jobs/:id/audit-logs - All roles */
router.get('/:id/audit-logs', getJobAuditLogs as unknown as RequestHandler);

/** POST /api/jobs - Admin, Operator */
router.post(
  '/',
  requireRole(['admin', 'operator']) as unknown as RequestHandler,
  createJob as unknown as RequestHandler,
);

/** PUT /api/jobs/:id - Admin, Operator */
router.put(
  '/:id',
  requireRole(['admin', 'operator']) as unknown as RequestHandler,
  updateJob as unknown as RequestHandler,
);

/** DELETE /api/jobs/:id - Admin only */
router.delete(
  '/:id',
  requireRole(['admin']) as unknown as RequestHandler,
  deleteJob as unknown as RequestHandler,
);

/** POST /api/jobs/:id/notes - Admin, Operator */
router.post(
  '/:id/notes',
  requireRole(['admin', 'operator']) as unknown as RequestHandler,
  createJobNote as unknown as RequestHandler,
);

export default router;
