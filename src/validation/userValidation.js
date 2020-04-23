/* eslint-disable newline-per-chained-call */
import { check } from 'express-validator';
import { nameRegex, phoneRegex } from '../utils/regexUtils';
import authValidation from './authValidation';


export default {
  email: authValidation.email.withMessage('Invalid email address'),
  password: authValidation.password.withMessage('Password must be at least 8 characters long'),
  phone: check('phone').matches(phoneRegex).withMessage('Invalid phone number'),
  lastName: check('lastName').matches(nameRegex)
    .withMessage('Last name is required, as a sequence of letters hyphenated or not'),
  firstName: check('firstName').matches(nameRegex)
    .withMessage('First name is required, as a sequence of letters hyphenated or not'),
  state: check('state').trim().isLength({ max: 50 }).not().isEmpty()
    .withMessage('State is required. Maximum length 50'),
  street: check('street').trim().isLength({ max: 80 }).not().isEmpty()
    .withMessage('Street is required. Maximum length 80'),
  country: check('country').trim().isLength({ max: 50 }).not().isEmpty()
    .withMessage('Country is required. Maximum length 50'),
  address: check('address').trim().isLength({ max: 150 }).not().isEmpty()
    .withMessage('Address is required. Maximum length 150'),
};
