/* eslint-disable import/prefer-default-export */
import bcrypt from 'bcrypt';

export const hashPassword = async (password) => bcrypt.hash(password, 10);
