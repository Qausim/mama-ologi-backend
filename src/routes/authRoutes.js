import { Router } from 'express';

import AuthMiddleware from '../middlewares/AuthMiddleware';
import AuthController from '../controllers/AuthController';


const authRouter = Router();

authRouter.post('/signin', ...AuthMiddleware.validateSigninFields(), AuthController.signin);
authRouter.post(
  '/signup', ...AuthMiddleware.validateSignupFields(), AuthMiddleware.validateAccountDoesNotExist, AuthController.signup,
);

export default authRouter;
