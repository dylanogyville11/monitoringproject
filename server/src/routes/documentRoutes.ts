import { Router, RequestHandler } from 'express';
import {
  updateDocument,
  uploadDocumentFile,
  deleteDocumentFile,
  addDocumentItem,
  deleteDocumentItem,
} from '../controllers/documentController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleGuard';
import { upload } from '../middleware/upload';

const router = Router();
const editors = requireRole(['admin', 'operator']) as unknown as RequestHandler;

// Semua route dokumen memerlukan autentikasi
router.use(authMiddleware as unknown as RequestHandler);

/** DELETE /api/documents/files/:fileId — Admin, Operator (didefinisikan sebelum /:id) */
router.delete('/files/:fileId', editors, deleteDocumentFile as unknown as RequestHandler);

/** POST /api/documents/:id/items — Admin, Operator (:id = stage_id) */
router.post('/:id/items', editors, addDocumentItem as unknown as RequestHandler);
router.post('/:id/documents', editors, addDocumentItem as unknown as RequestHandler);

/** POST /api/documents/:id/upload — Admin, Operator */
router.post('/:id/upload', editors, upload.single('file'), uploadDocumentFile as unknown as RequestHandler);

/** PATCH /api/documents/:id — Admin, Operator */
router.patch('/:id', editors, updateDocument as unknown as RequestHandler);

/** DELETE /api/documents/:id — Admin, Operator (hanya dokumen kustom) */
router.delete('/:id', editors, deleteDocumentItem as unknown as RequestHandler);

export default router;
