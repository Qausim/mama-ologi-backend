/* eslint-disable newline-per-chained-call */
import { check } from 'express-validator';
import { nameRegex, phoneRegex } from '../utils/regexUtils';
import authValidation from './authValidation';
import {
  invalidEmailError, passwordValidationError, firstNameValidationError, lastNameValidationError,
  phoneValidationError, addressValidationError, streetValidationError, stateValidationError,
  countryValidationError,
} from '../utils/constants';


export default {
  email: authValidation.email.withMessage(invalidEmailError),
  password: authValidation.password.withMessage(passwordValidationError),
  phone: check('phone').matches(phoneRegex).withMessage(phoneValidationError),
  lastName: check('lastName').matches(nameRegex)
    .withMessage(lastNameValidationError),
  firstName: check('firstName').matches(nameRegex)
    .withMessage(firstNameValidationError),
  state: check('state').trim().isLength({ max: 50 }).not().isEmpty()
    .withMessage(stateValidationError),
  street: check('street').trim().isLength({ max: 80 }).not().isEmpty()
    .withMessage(streetValidationError),
  country: check('country').trim().isLength({ max: 50 }).not().isEmpty()
    .withMessage(countryValidationError),
  address: check('address').trim().isLength({ max: 150 }).not().isEmpty()
    .withMessage(addressValidationError),
};
