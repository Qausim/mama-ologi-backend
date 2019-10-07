import jwt from 'jsonwebtoken';

import envVariables from '../environment';


const { jwtSecret } = envVariables;

/**
 * Defines methods that handle jwt operations
 */
export default class {
  /**
   * Signs a user credentials and returns a token
   * @param {object} user
   * @returns {string} token
   */
  static generateToken({ id: userId, email: userEmail }) {
    return jwt.sign({ userId, userEmail }, jwtSecret);
  }

  static verifyToken(token) {
    return jwt.verify(token, jwtSecret);
  }
}
