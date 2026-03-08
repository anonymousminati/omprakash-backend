import { Router } from 'express';
import { InnovationController } from '../controllers/innovation.controller';
import { authenticate, authorize } from '../../../middleware/auth';

const router = Router();
const controller = new InnovationController();

router.post('/', authenticate, authorize('innovations', 'create'), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.put('/:id', authenticate, authorize('innovations', 'update'), controller.update);
router.delete('/:id', authenticate, authorize('innovations', 'delete'), controller.delete);

export default router;
