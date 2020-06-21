/* eslint-disable no-param-reassign */
/* eslint-disable newline-per-chained-call */
import { validationResult } from 'express-validator';
import Responses from '../utils/responseUtils';
import CloudinaryService from '../services/cloudinaryService';
import {
  createProductValidations, updateProductValidations, cartValidation,
} from '../validation/productValidation';
import { extractValidationErrors } from '../utils/errorUtils';
import {
  productNotFoundError, productNoImageError, maxImagesError, maxImageSizeAndFormatError,
} from '../utils/constants';
import Product from '../models/product';
import { getDebugger, debugHelper } from '../utils/debugUtils';


const debug = getDebugger('app:ProductMiddleware');
/**
 * Defines middlewares for the product routes
 */
export default class ProductMiddleware {
  /**
   * Validates request data to create a new product
   * @returns {array}
   */
  static validateCreateProductData() {
    return [
      ...Object.values(createProductValidations),
      updateProductValidations.discount,
      (request, response, next) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
          const error = extractValidationErrors(errors);
          return Responses.badRequestError(response, error);
        }
        next();
      },
    ];
  }

  /**
   * Filters existing product images to determine which to delete and which to spare
   * @param {array} existingImages
   * @param {array} productImages
   * @param {object} error
   */
  static filterImagesToDelete(existingImages, productImages, error) {
    const imagesToDelete = [];
    const sparedImages = [];
    existingImages.forEach((img) => {
      if (img.split(':')[0] === 'deleted') imagesToDelete.push(img.slice(8));
      else sparedImages.push(img);
    });

    if (!(sparedImages.length + productImages.length)) {
      error.message = productNoImageError;
    } else if (sparedImages.length + productImages.length > 4) error.message = maxImagesError;

    return { imagesToDelete, sparedImages };
  }

  /**
   * Checks if there are image uploads in the request and uploads them to Cloudinary
   * @param {object} request
   * @param {object} response
   * @param {callback} next
   */
  static async processImages(request, response, next) {
    const { files, body: { productImages: existingImages = [] } } = request;
    let productImages = []; let remainingImages = []; const errors = {};
    if (files && files.productImages) {
      productImages = files.productImages[0] ? files.productImages : [files.productImages];
    }
    try {
      if (existingImages.length) {
        const { sparedImages, imagesToDelete } = ProductMiddleware
          .filterImagesToDelete(existingImages, productImages, errors);
        remainingImages = sparedImages;
        if (errors.message) return Responses.badRequestError(response, errors);
        if (imagesToDelete.length) await CloudinaryService.deleteImages(imagesToDelete);
        request.body.images = sparedImages;
      }
      // If no images proceed to the controller
      if (!(productImages.length)) return next();
      // Format it to be an array in all cases
      productImages = productImages[0] ? productImages : [productImages];
      if (productImages.length > 4) {
        return Responses.badRequestError(response, { message: maxImagesError });
      }
      const wrongFormatOrTooHeavy = productImages
        .find(({ type, size }) => !['image/jpeg', 'image/png'].includes(type) || size > 2 * 1024 * 1024);
      if (wrongFormatOrTooHeavy) {
        return Responses.badRequestError(response, { message: maxImageSizeAndFormatError });
      }

      CloudinaryService.uploadImages(request, productImages, remainingImages, next);
    } catch (error) {
      debugHelper.error(debug, error);
      next(new Error());
    }
  }

  /**
   * Checks if a requested product exists or not
   * @param {object} request
   * @param {object} response
   * @param {callback} next
   * @returns {object|undefined} response or undefined
   */
  static async verifyProductExists(request, response, next) {
    const { productId } = request.params;
    try {
      // Ensure the product exists else return a 404 error
      const product = await Product.findById(productId, request.method.toLowerCase());
      if (!product) return Responses.notFoundError(response, productNotFoundError);
      // If product exists attach it to the request object and proceed
      request.product = product;
      next();
    } catch (error) {
      debugHelper.error(debug, error);
      next(new Error());
    }
  }

  /**
   * Validates that the requesting user has the permission to carry out an operation on a product
   * @param {object} request
   * @param {object} response
   * @param {callback} next
   * @returns {object|undefined} response or undefined
   */
  static validateUserCanOperateProduct(request, response, next) {
    const { user: { userId }, product } = request;
    // Ensure the user has permission to delete the product (this may feel unnecessary now but
    // preparing for when there'll be need to scale)
    if (product.owner_id !== userId) {
      return Responses.conflictError(response, 'You are not permitted to perform this operation on the product');
    }
    next();
  }

  /**
   * Validates request data to update a product
   * @returns {array}
   */
  static validateProductUpdateData() {
    return [
      ...Object.values(updateProductValidations),
      (request, response, next) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
          const error = extractValidationErrors(errors);
          return Responses.badRequestError(response, error);
        }
        next();
      },
    ];
  }

  /**
   * Validates data for a wishlist operation
   * @returns {array}
   */
  static validateCartData() {
    return [
      cartValidation.quantity,
      (request, response, next) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
          const error = extractValidationErrors(errors);
          return Responses.badRequestError(response, error);
        }
        next();
      },
    ];
  }
}
