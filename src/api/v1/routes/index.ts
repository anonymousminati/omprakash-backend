import express from 'express';
const router = express.Router();
import innovationRouter from './innovation.routes';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import rbacRouter from './rbac.routes';
import complaintRouter from './complaint.routes';

router.use('/innovations', innovationRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/complaints', complaintRouter);
router.use('/rbac', rbacRouter);

export default router;
