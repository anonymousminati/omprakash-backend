import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { uploadMiddleware } from '../../../middleware/uploadMiddleware';
import { authenticate, authorize } from '../../../middleware/auth';

const router  = Router();
const ctrl    = new PostController();
const uploads = uploadMiddleware.array('images', 20); // up to 20 images

// ── Public routes (website) ─────────────────────────────────────
router.get('/',        ctrl.list);        // published posts, paginated
router.get('/slug/:slug', ctrl.getBySlug); // by slug

// ── Protected routes (backpanel) ────────────────────────────────
router.get('/all',     authenticate, authorize('posts', 'read'),   ctrl.listAll);
router.get('/:id',     authenticate, authorize('posts', 'read'),   ctrl.getById);
router.post('/',       authenticate, authorize('posts', 'create'), uploads, ctrl.create);
router.put('/:id',     authenticate, authorize('posts', 'update'), uploads, ctrl.update);
router.delete('/:id',  authenticate, authorize('posts', 'delete'), ctrl.delete);

export default router;
