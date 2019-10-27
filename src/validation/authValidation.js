import { check } from 'express-validator';


export default {
  email: check('email').isEmail(),
  password: check('password').isString().isLength({ min: 8 }),
};
