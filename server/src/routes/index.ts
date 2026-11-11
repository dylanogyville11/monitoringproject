import { Router } from 'express';
import authRoutes from './authRoutes';
import jobRoutes from './jobRoutes';
import documentRoutes from './documentRoutes';
import reportRoutes from './reportRoutes';
import userRoutes from './userRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/documents', documentRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);

export default router;
