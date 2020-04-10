/* eslint-disable no-param-reassign */
/* eslint-disable newline-per-chained-call */
import { validationResult } from 'express-validator';
import Responses from '../utils/responseUtils';
import CloudinaryService from '../services/cloudinaryService';
import Products from '../db/products';
import { createProductValidations, updateProductValidations } from '../validation/productValidation';


const maxImageError = 'Maximum of 4 image files allowed';
/**
 * Defines middlewares for the product routes
 */
export default class ProductMiddlware {
  /**
   * Validates request data to create a new product
   * @returns {array}
   */
  static validateCreateProductData() {
    return [
      ...Object.values(createProductValidations),
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
   * Filters existing product images to determine which to delete and which to spare
   * @param {array} existingImages
   * @param {array} productImages
   * @param {object} error
   */
  static filterImagesToDelete(existingImages, productImages = [], error) {
    const imagesToDelete = [];
    const sparedImages = [];
    existingImages.forEach((img) => {
      if (img.split(':')[0] === 'deleted') imagesToDelete.push(img.slice(8));
      else sparedImages.push(img);
    });

    if (!(sparedImages.length + productImages.length)) {
      error.message = 'There must be at least one image for a product';
    } else if (sparedImages.length + productImages.length > 4) error.message = maxImageError;

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
    let productImages; let remainingImages = []; const errors = {};
    if (files) productImages = files.productImages;
    try {
      if (existingImages.length) {
        const { sparedImages, imagesToDelete } = ProductMiddlware
          .filterImagesToDelete(existingImages, productImages, errors);
        remainingImages = sparedImages;
        if (errors.message) return Responses.badRequestError(response, errors);
        if (imagesToDelete.length) await CloudinaryService.deleteImages(imagesToDelete);
        request.body.images = sparedImages;
      }
      // If no images proceed to the controller
      if (!(productImages)) return next();
      // Format it to be an array in all cases
      productImages = productImages[0] ? productImages : [productImages];
      if (productImages.length > 4) {
        return Responses.badRequestError(response, { message: maxImageError });
      }
      const wrongFormatOrTooHeavy = productImages
        .find(({ type, size }) => !['image/jpeg', 'image/png'].includes(type) || size > 2 * 1024 * 1024);
      if (wrongFormatOrTooHeavy) {
        return Responses.badRequestError(response, { message: 'Only jpeg and png images, each not greater than 2mb, are allowed' });
      }

      CloudinaryService.uploadImages(request, productImages, remainingImages, next);      
    } catch (error) {
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
      const res = await Products.getProduct(productId, request.method.toLowerCase());
      if (!res.rowCount) return Responses.notFoundError(response, 'Product not found');
      // If product exists attach it to the request object and proceed
      const { rows: [product] } = res;
      request.product = product;
      next();
    } catch (error) {
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
      return Responses.forbiddenError(response, 'You are not permitted to perform this operation on the product');
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
}
