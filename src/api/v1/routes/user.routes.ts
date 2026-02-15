import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../../../middleware/auth';

const router = Router();
const controller = new UserController();

// Protect all user routes
router.use(authenticate);

router.post('/', authorize('users', 'create'), controller.create);
router.get('/', authorize('users', 'read'), controller.list);
router.get('/:id', authorize('users', 'read'), controller.get);
router.put('/:id', authorize('users', 'update'), controller.update);
router.delete('/:id', authorize('users', 'delete'), controller.delete);

export default router;
