import { validationResult } from 'express-validator';

import Responses from '../utils/responseUtils';
import jwtUtils from '../utils/jwtUtils';
import authValidation from '../validation/authValidation';
import userValidation from '../validation/userValidation';
import { extractValidationErrors } from '../utils/errorUtils';
import User from '../models/user';
import { emptyTokenError, invalidTokenError, signinError, accountConflictError } from '../utils/constants';
import { getDebugger, debugHelper } from '../utils/debugUtils';


const debug = getDebugger('app:AuthMiddleware');

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
      authValidation.email,
      authValidation.password,
      (request, response, next) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
          return Responses.unauthorizedError(response, signinError);
        }
        return next();
      },
    ];
  }

  /**
   * Validates user token
   * @param {object} request
   * @param {object} response
   * @param {function} next
   */
  static validateToken(request, response, next) {
    let { headers: { authorization: token } } = request;
    if (!token) return Responses.unauthorizedError(response, emptyTokenError);
    if (token.startsWith('Bearer')) [, token] = token.split(' ');
    try {
      const { userId, userEmail } = jwtUtils.verifyToken(token);
      request.user = { userId, userEmail };
      next();
    } catch (error) {
      debugHelper.error(debug, error);
      return Responses.unauthorizedError(response, invalidTokenError);
    }
  }

  /**
   * Validates fields in signup request
   * @returns {array}
   */
  static validateSignupFields() {
    return [
      userValidation.email,
      userValidation.phone,
      userValidation.password,
      userValidation.lastName,
      userValidation.firstName,
      userValidation.address,
      userValidation.street,
      userValidation.state,
      userValidation.country,
      (request, response, next) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
          const error = extractValidationErrors(errors);
          return Responses.badRequestError(response, error);
        }
        return next();
      },
    ];
  }

  /**
   * Validates if an account already exists in the database
   * @param {object} request
   * @param {object} response
   * @param {function} next
   */
  static async validateAccountDoesNotExist(request, response, next) {
    const { body: { email } } = request;
    try {
      const user = await User.findByEmail(email);
      if (user) return Responses.badRequestError(response, { message: accountConflictError }, 409);
      next();
    } catch (error) {
      debugHelper.error(debug, error);
      next(new Error());
    }
  }
}
