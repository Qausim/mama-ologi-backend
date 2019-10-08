import bcrypt from 'bcrypt';

import envVariables from '../environment';


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
}
