/* eslint-disable newline-per-chained-call */
import { body, oneOf } from 'express-validator';
import {
  quantityValidationError, productTitleValidationError, productPriceValidationError,
  productWeightValidationError, productDescriptionValidationError,
  productStockValidationError, productDiscountValidationError,
} from '../utils/constants';

export const createProductValidations = {
  title: oneOf([body('title').trim().isString().isLength({ min: 6 })],
    productTitleValidationError),

  price: body('price').trim().isNumeric()
    .withMessage(productPriceValidationError),

  weight: body('weight').trim().isNumeric()
    .withMessage(productWeightValidationError),

  description: body('description').trim().not().isEmpty()
    .withMessage(productDescriptionValidationError),

  stock: body('stock').trim().isInt({ min: 1 })
    .withMessage(productStockValidationError),
};

export const updateProductValidations = {
  title: oneOf([body('title').if(body('title').exists()).trim().isString()
    .isLength({ min: 6 })], productTitleValidationError),

  price: body('price').if(body('price').exists()).trim().isNumeric()
    .withMessage(productPriceValidationError),

  weight: body('weight').if(body('weight').exists()).trim().isNumeric()
    .withMessage(productWeightValidationError),

  description: body('description').if(body('description').exists()).trim().not()
    .isEmpty().withMessage(productDescriptionValidationError),

  stock: body('stock').if(body('stock').exists()).trim().isInt({ min: 1 })
    .withMessage(productStockValidationError),

  discount: body('discount').if(body('discount').exists()).trim().isFloat({ min: 0, max: 1 })
    .withMessage(productDiscountValidationError),
};

export const cartValidation = {
  quantity: body('quantity').isInt().withMessage(quantityValidationError),
};
