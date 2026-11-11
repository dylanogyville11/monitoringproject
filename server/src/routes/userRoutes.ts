import { Router, RequestHandler } from 'express';
import { getUsers, getUserById, createUser, updateUser } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleGuard';

const router = Router();

// Manajemen pengguna: khusus admin
router.use(authMiddleware as unknown as RequestHandler);
router.use(requireRole(['admin']) as unknown as RequestHandler);

router.get('/', getUsers as unknown as RequestHandler);
router.post('/', createUser as unknown as RequestHandler);
router.get('/:id', getUserById as unknown as RequestHandler);
router.patch('/:id', updateUser as unknown as RequestHandler);

export default router;
