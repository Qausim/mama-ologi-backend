import Products from '../db/products';
import Responses from '../utils/responseUtils';
import CloudinaryService from '../services/cloudinaryService';

/**
 * Defines the controllers for the /products endpoint
 */
export default class ProductController {
  /**
   * Creates a new product in the database records
   * @param {object} request
   * @param {object} response
   * @param {callback} next
   */
  static async addProduct(request, response, next) {
    const {
      title, price, priceDenomination, weight, weightUnit, description, images,
    } = request.body;
    const { userId: ownerId } = request.user;
    const newProduct = {
      ownerId,
      title: title.trim(),
      price: { value: price.trim(), denomination: priceDenomination.trim() },
      weight: { value: weight.trim(), unit: weightUnit.trim() },
      description: description.trim(),
      images: images || [],
    };

    try {
      const product = await Products.addProduct(newProduct);
      Responses.success(response, product, 201);
    } catch (error) {
      next(new Error());
    }
  }

  /**
   * Deletes a product and all associated resources from the db
   * @param {object} request
   * @param {object} response
   * @param {callback} next
   * @returns {object} response
   */
  static async deleteProduct(request, response, next) {
    const { product } = request;
    const { productId } = request.params;
    try {
      // If there are images delete them from the third party service
      if (product.images.length) await CloudinaryService.deleteImages(product.images);

      // Delete from the records
      await Products.deleteProduct(productId);
      return Responses.success(response, { message: `"${product.title}" successfully deleted` });
    } catch (error) {
      next(new Error());
    }
  }

  /**
   * @param {object} request
   * @param {object} response
   * @param {callback} next
   * @returns {object} product
   */
  static async updateProduct(request, response, next) {
    const { productId } = request.params;
    const expectedFields = [
      'title', 'price', 'priceDenomination', 'weight', 'weightUnit', 'description', 'images',
    ];
    const cleanedData = {};

    try {
      expectedFields.forEach((field) => {
        const value = request.body[field];
        if (value) cleanedData[field] = typeof value === 'string' ? value.trim() : value;
      });

      const product = await Products.updateProduct(productId, request.product, cleanedData);
      return Responses.success(response, product);
    } catch (error) {
      next(new Error());
    }
  }

  /**
   * Retrieves all existing products in the database
   * @param {object} request
   * @param {object} response
   * @param {callback} next
   */
  static async getProducts(request, response, next) {
    let { query: { page } } = request;
    if (page) {
      page = parseInt(page, 10);
      if (!page || page <= 0) {
        return Responses.badRequestError(response, {
          message: 'Query parameter value for "page" must be a number greater than zero',
        });
      }
    } else page = 1;

    try {
      const products = await Products.getProducts(page);
      return Responses.success(response, products);
    } catch (error) {
      next(new Error());
    }
  }

  static async getProduct(request, response) {
    return Responses.success(response, request.product);
  }
}
