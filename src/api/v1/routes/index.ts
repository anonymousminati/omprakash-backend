import express from 'express';
const router = express.Router();
import innovationRouter from './innovation.routes';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import rbacRouter from './rbac.routes';
import complaintRouter from './complaint.routes';
import contactRouter from './contact.routes';
import galleryRouter from './gallery.routes';

router.use('/innovations', innovationRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/complaints', complaintRouter);
router.use('/contacts', contactRouter);
router.use('/rbac', rbacRouter);
router.use('/gallery', galleryRouter);

export default router;
