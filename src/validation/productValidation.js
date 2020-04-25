/* eslint-disable newline-per-chained-call */
import { body, oneOf } from 'express-validator';
import { quantityValidationError } from '../utils/constants';

export const createProductValidations = {
  title: oneOf([body('title').trim().isString().isLength({ min: 6 })],
    'Please enter a valid title for the product (at least 6 characters)'),

  price: body('price').trim().isNumeric()
    .withMessage('Please enter a valid price (numeric) for the product'),

  priceDenomination: body('priceDenomination').trim().isIn(['NGN', 'USD'])
    .withMessage('Please choose a denomination for the price'),

  weight: body('weight').trim().isNumeric()
    .withMessage('Please enter a valid weight (numeric) value for the product'),

  weightUnit: body('weightUnit').trim().isIn(['kg', 'g'])
    .withMessage('Please choose unit for the weight, "g" or "kg"'),

  description: body('description').trim().not().isEmpty()
    .withMessage("Please provide the product's description"),
};

export const updateProductValidations = {
  title: oneOf([body('title').if(body('title').exists()).trim().isString()
    .isLength({ min: 6 })], 'Please enter a valid title for the product (at least 6 characters)'),

  price: body('price').if(body('price').exists()).trim().isNumeric()
    .withMessage('Please enter a valid price (numeric) for the product'),

  priceDenomination: body('priceDenomination').if(body('priceDenomination').exists())
    .trim().isIn(['NGN', 'USD']).withMessage('Please choose a denomination for the price'),

  weight: body('weight').if(body('weight').exists()).trim().isNumeric()
    .withMessage('Please enter a valid weight (numeric) value for the product'),

  weightUnit: body('weightUnit').if(body('weightUnit').exists()).trim().isIn(['kg', 'g'])
    .withMessage('Please choose unit for the weight, "g" or "kg"'),

  description: body('description').if(body('description').exists()).trim().not()
    .isEmpty().withMessage("Please provide the product's description"),
};

export const wishlistValidation = {
  quantity: body('quantity').isInt().withMessage(quantityValidationError),
};
