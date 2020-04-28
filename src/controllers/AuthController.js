import bcrypt from 'bcrypt';

import Users from '../db/users';
import Responses from '../utils/responseUtils';
import jwtUtils from '../utils/jwtUtils';
import { hashPassword } from '../utils/authUtils';


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
      const userRes = await Users.getUser(email);
      if (userRes.rowCount) {
        const { rows: [user] } = userRes;
        const verified = await bcrypt.compare(password, user.password);
        user.token = jwtUtils.generateToken(user);
        delete user.password; delete user.id;
        if (verified) return Responses.success(response, user);
      }

      Responses.unauthorizedError(response, 'Invalid email or password');
    } catch (error) {
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
      const res = await Users
        .insertUser(
          email, hashedPassword, firstName, lastName, phone, address, street, state, country,
        );

      res.rows[0].wishlist = [];
      res.rows[0].cart = [];
      res.rows[0].token = jwtUtils.generateToken(res.rows[0]);
      return Responses.success(response, res.rows[0], 201);
    } catch (error) {
      next(new Error('Unable to create account'));
    }
  }
}
