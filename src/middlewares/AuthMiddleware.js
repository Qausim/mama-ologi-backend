import { check, validationResult } from 'express-validator';

import Responses from '../utils/responseUtils';


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
}
