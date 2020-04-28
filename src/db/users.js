import dbConnection from './dbConnection';
import { userTableName, roleTableName } from '../utils/constants';


/**
 * Mimics a database users table
 * @returns {Promise<array>} users
 */
export default class Users {
  /**
   * Retrieves a particular user from db
   * @param {string} userEmail
   */
  static async getUser(userEmail) {
    return dbConnection.dbConnect(
      `SELECT * FROM ${userTableName} AS users LEFT JOIN ${roleTableName} AS roles ON users.role_id=roles.id, get_wishlist(users.id) AS wishlist WHERE email=$1`, [userEmail],
    );
  }

  /**
   * Inserts a new user into the db
   * @param {string} email
   * @param {string} password
   * @param {string} firstName
   * @param {string} lastName
   * @param {string} phone
   * @param {string} address
   * @param {string} street
   * @param {string} state
   * @param {string} country
   */
  static async insertUser(
    email, password, firstName, lastName, phone, address, street, state, country,
  ) {
    return dbConnection.dbConnect(
      `INSERT INTO ${userTableName} (
        email, password, first_name, last_name, phone, address, street, state, country
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) returning id, email, first_name, last_name, phone, address, street, state, country, role_id`,
      [email, password, firstName, lastName, phone, address, street, state, country],
    );
  }
}
