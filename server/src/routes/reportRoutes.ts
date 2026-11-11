import { Router, RequestHandler } from 'express';
import { getDashboard, exportExcel } from '../controllers/reportController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All report routes require authentication (all roles can view)
router.use(authMiddleware as unknown as RequestHandler);

/** GET /api/reports/dashboard - All roles */
router.get('/dashboard', getDashboard as unknown as RequestHandler);

/** GET /api/reports/export-excel - All roles */
router.get('/export-excel', exportExcel as unknown as RequestHandler);

export default router;
