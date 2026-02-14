import express from 'express';
const router = express.Router();
import demoRouter from './demo/router';
import innovationRouter from './innovation.routes';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import rbacRouter from './rbac.routes';

router.use('/demo', demoRouter);
router.use('/innovations', innovationRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/rbac', rbacRouter);

export default router;
