import { Router } from 'express';
import { ComplaintController } from '../controllers/complaint.controller';
import { uploadMiddleware } from '../../../middleware/uploadMiddleware';
import { authenticate, authorize } from '../../../middleware/auth';

const router = Router();
const controller = new ComplaintController();

// Public routes — no auth required
router.post('/', uploadMiddleware.single('photo'), controller.create);
router.get('/:id', controller.get);   // citizens track their own complaint by ID

// Protected routes — backpanel only
router.get('/', authenticate, authorize('complaints', 'read'), controller.list);
router.put('/:id', authenticate, authorize('complaints', 'update'), uploadMiddleware.single('photo'), controller.update);
router.delete('/:id', authenticate, authorize('complaints', 'delete'), controller.delete);

export default router;
