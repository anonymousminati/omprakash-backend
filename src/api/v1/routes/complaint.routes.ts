import { Router } from 'express';
import { ComplaintController } from '../controllers/complaint.controller';
import { uploadMiddleware } from '../../../middleware/uploadMiddleware';
import { authenticate, authorize } from '../../../middleware/auth';

const router = Router();
const controller = new ComplaintController();

// Public route for submitting complaints
router.post('/', uploadMiddleware.single('photo'), controller.create);

// Protected routes for backpanel
router.get('/', authenticate, authorize('complaints', 'read'), controller.list);
router.get('/:id', authenticate, authorize('complaints', 'read'), controller.get);
router.put('/:id', authenticate, authorize('complaints', 'update'), uploadMiddleware.single('photo'), controller.update);
router.delete('/:id', authenticate, authorize('complaints', 'delete'), controller.delete);

export default router;
