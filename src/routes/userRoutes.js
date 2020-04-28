import { Router } from 'express';
import AuthMiddleware from '../middlewares/AuthMiddleware';
import UserController from '../controllers/UserController';

const userRouter = Router();

userRouter.get('/wishlist', AuthMiddleware.validateToken, UserController.getWishlist);
userRouter.get('/cart', AuthMiddleware.validateToken, UserController.getCart);

export default userRouter;
