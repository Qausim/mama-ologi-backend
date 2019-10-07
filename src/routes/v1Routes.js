import { Router } from 'express';

import authRouter from './authRoutes';
import productRouter from './productRoutes';


const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/products', productRouter);

export default v1Router;
