/* eslint-disable import/prefer-default-export */
import bcrypt from 'bcrypt';


/**
 * Hashes a password string
 * @param {string} password
 */
export const hashPassword = async (password) => bcrypt.hash(password, 10);
