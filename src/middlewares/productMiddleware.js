/* eslint-disable newline-per-chained-call */
import { body, oneOf, validationResult } from 'express-validator';
import Responses from '../utils/responseUtils';
import CloudinaryService from '../services/cloudinaryService';


/**
 * Defines middlewares for the product routes
 */
export default class ProductMiddlware {
  /**
   * Validates request data to create a new product
   * @returns {array}
   */
  static validateProductData() {
    return [
      oneOf([body('title').trim().isString().isLength({ min: 6 })],
        'Please enter a valid title for the product (at least 6 characters)'),
      body('price').trim().isNumeric().withMessage('Please enter a valid price (numeric) for the product'),
      body('priceDenomination').trim().isIn(['NGN', 'USD']).withMessage('Please choose a denomination for the price'),
      body('weight').trim().isNumeric().withMessage('Please enter a valid weight (numeric) value for the product'),
      body('weightUnit').trim().isIn(['kg', 'g']).withMessage('Please choose unit for the weight, "g" or "kg"'),
      body('description').trim().not().isEmpty().withMessage("Please provide the product's description"),
      (request, response, next) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
          const error = errors.errors.map((el) => {
            let key;
            if (el.nestedErrors) key = el.nestedErrors[0].param;
            else key = el.param;
            return ({ [key]: el.msg });
          });
          return Responses.badRequestError(response, error);
        }
        next();
      },
    ];
  }

  /**
   * Checks if there are image uploads in the request and uploads them to Cloudinary
   * @param {object} request
   * @param {object} response
   * @param {callback} next
   */
  static processImages(request, response, next) {
    let { productImages } = request.files;
    // If no images proceed to the controller
    if (!(productImages)) return next();
    // "productImages" is an array when more than one file but an object when a single file
    // Format it to be an array in all cases
    productImages = productImages[0] ? productImages : [productImages];
    if (productImages.length > 4) return Responses.badRequestError(response, { message: 'Maximum of 4 image files allowed' });
    // If there's a file type other than "jpeg" or "png", or greater than 2mb, terminate the request
    const wrongFormatOrTooHeavy = productImages.find(({ type, size }) => !['image/jpeg', 'image/png'].includes(type)
      || size > 2 * 1024 * 1024);

    if (wrongFormatOrTooHeavy) {
      return Responses.badRequestError(response, { message: 'Only jpeg and png images, each not greater than 2mb, are allowed' });
    }

    CloudinaryService.uploadImages(request, productImages, next);
  }
}
