import { Router } from 'express';
import { InnovationController } from '../controllers/innovation.controller';

const router = Router();
const controller = new InnovationController();

router.post('/', controller.create);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
