import bcrypt from 'bcrypt';

import User from '../models/user';
import { getDebugger, debugHelper } from '../utils/debugUtils';
import jwtUtils from '../utils/jwtUtils';
import Responses from '../utils/responseUtils';
import { hashPassword } from '../utils/authUtils';
import { signinError } from '../utils/constants';


const debug = getDebugger('app:AuthController');

/**
 * Defines the controllers for authentication routes
 */
export default class AuthController {
  /**
   * Handles signin request to the server
   * @param {object} request
   * @param {object} response
   * @param {callback} next
   * @returns {object} response
   */
  static async signin(request, response, next) {
    try {
      const { body: { email, password } } = request;
      const user = await User.findByEmail(email);
      if (user) {
        const verified = await bcrypt.compare(password, user.password);
        user.token = jwtUtils.generateToken(user);
        delete user.password; delete user.id;
        if (verified) return Responses.success(response, user);
      }

      Responses.unauthorizedError(response, signinError);
    } catch (error) {
      debugHelper.error(debug, error);
      next(new Error());
    }
  }

  /**
   * Signs a new user up
   * @param {object} request
   * @param {object} response
   * @param {function} next
   */
  static async signup(request, response, next) {
    const {
      email, password, firstName, lastName, phone, address, street, state, country,
    } = request.body;

    try {
      const hashedPassword = await hashPassword(password);
      const user = new User(
        email, hashedPassword, firstName, lastName, phone, address, street, state, country,
      );
      const res = await user.save();

      res.wishlist = [];
      res.cart = [];
      res.token = jwtUtils.generateToken(res);
      return Responses.success(response, res, 201);
    } catch (error) {
      debugHelper.error(debug, error);
      next(new Error('Unable to create account'));
    }
  }
}
