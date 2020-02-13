import bcrypt from 'bcrypt';

import envVariables from '../environment';
import dbConnection from './dbConnection';
import { userTableName, roleTableName } from './migration';


const { adminEmail: email, adminPassword } = envVariables;

/**
 * Mimics a database users table
 * @returns {Promise<array>} users
 */
export default class Users {
  static async getUsers() {
    const password = await bcrypt.hash(adminPassword, 10);
    return [
      {
        id: 1,
        email,
        password,
        firstName: 'Olawumi',
        lastName: 'Yusuff',
      },
    ];
  }

  static async getUser(userEmail) {
    return dbConnection.dbConnect(
      `SELECT * FROM ${userTableName} LEFT JOIN ${roleTableName} ON ${userTableName}.role_id = ${roleTableName}.id WHERE email = $1`, [userEmail],
    );
  }
}
