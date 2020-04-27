import { Router } from 'express';

import authRouter from './authRoutes';
import productRouter from './productRoutes';
import userRouter from './userRoutes';


const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/products', productRouter);
v1Router.use('/user', userRouter);

export default v1Router;
