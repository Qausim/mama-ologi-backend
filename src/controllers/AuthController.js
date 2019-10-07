import bcrypt from 'bcrypt';

import Users from '../db/users';
import Responses from '../utils/responseUtils';
import jwtUtils from '../utils/jwtUtils';


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
      const users = await Users.getUsers();
      const user = users.find((el) => el.email === email);
      if (user) {
        const verified = await bcrypt.compare(password, user.password);
        user.token = jwtUtils.generateToken(user);
        if (verified) return Responses.success(response, { ...user, password: undefined });
      }

      Responses.unauthorizedError(response, 'Invalid email or password');
    } catch (error) {
      next(new Error());
    }
  }
}
