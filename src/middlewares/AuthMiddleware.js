import { check, validationResult } from 'express-validator';

import Responses from '../utils/responseUtils';
import jwtUtils from '../utils/jwtUtils';


/**
 * Defines the authentication middlewares
 */
export default class AuthMiddleware {
  /**
   * Checks that request data to the signin route is valid
   * @returns {Array}
   */
  static validateSigninFields() {
    return [
      check('email').isEmail(),
      check('password').isString().isLength({ min: 8 }),
      (request, response, next) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
          return Responses.unauthorizedError(response, 'Invalid email or password');
        }
        return next();
      },
    ];
  }

  static validateToken(request, response, next) {
    let { headers: { authorization: token } } = request;
    if (!token) return Responses.unauthorizedError(response, 'You need to be signed in to post a product');
    if (token.startsWith('Bearer')) [, token] = token.split(' ');
    try {
      const { userId, userEmail } = jwtUtils.verifyToken(token);
      request.user = { userId, userEmail };
      next();
    } catch (error) {
      return Responses.unauthorizedError(response, 'Unauthorized operation, please sign in and try again');
    }
  }
}
