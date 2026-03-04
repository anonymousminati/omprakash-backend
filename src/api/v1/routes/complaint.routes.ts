import { Router } from 'express';
import { ComplaintController } from '../controllers/complaint.controller';
import { uploadMiddleware } from '../../../middleware/uploadMiddleware';

const router = Router();
const controller = new ComplaintController();

router.post('/', uploadMiddleware.single('photo'), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.put('/:id', uploadMiddleware.single('photo'), controller.update);
router.delete('/:id', controller.delete);

export default router;
