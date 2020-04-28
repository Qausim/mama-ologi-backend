import Products from '../db/products';
import Responses from '../utils/responseUtils';
import CloudinaryService from '../services/cloudinaryService';
import { productCreationError, productTableName } from '../utils/constants';


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
    try {
      const insertRes = await Products.addProduct(request);
      const { rows: [product] } = insertRes;
      return product
        ? Responses.success(response, product, 201)
        : Responses.forbiddenError(response, productCreationError);
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
    const body = [];
    expectedFields.forEach((field) => {
      const value = request.body[field];
      if (value) {
        // eslint-disable-next-line no-nested-ternary
        const key = field === 'priceDenomination' ? 'price_denomination' : field === 'weightUnit' ? 'weight_unit' : field;
        body.push([
          key, typeof value === 'string' ? value.trim() : value,
        ]);
      }
    });

    let preparedQuery = '';
    const preparedData = [];
    body.forEach(([key, value], index) => {
      preparedQuery += `${key} = $${index + 1}`;
      preparedQuery += index === body.length - 1 ? ' ' : ', ';
      preparedData.push(value);
    });
    preparedQuery = `UPDATE ${productTableName} SET ${preparedQuery}WHERE id = $${preparedData.length + 1} RETURNING *`;
    preparedData.push(productId);

    try {
      const res = await Products.updateProduct(preparedQuery, preparedData);
      return Responses.success(response, res.rows[0]);
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
      if (Number.isNaN(page) || page <= 0) {
        return Responses.badRequestError(response, {
          message: 'Query parameter value for "page" must be a number greater than zero',
        });
      }
    } else page = 1;

    try {
      const res = await Products.getProducts(page);
      const { rows: products } = res;
      return Responses.success(response, products);
    } catch (error) {
      next(new Error());
    }
  }

  /**
   * Send product in response
   * @param {object} request
   * @param {object} response
   */
  static getProduct(request, response) {
    return Responses.success(response, request.product);
  }

  /**
   * Adds a product to wishlist
   * @param {object} request
   * @param {object} response
   * @param {function} next
   */
  static async addToWishlist(request, response, next) {
    const { user: { userId }, params: { productId }, body: { quantity } } = request;
    try {
      const { rows: [{ wishlist }] } = await Products.addToWishlist(userId, productId, quantity);
      return Responses.success(response, wishlist, 200);
    } catch (error) {
      next(new Error());
    }
  }

  static async removeFromWishlist(request, response, next) {
    const { user: { userId }, params: { productId } } = request;
    try {
      const wishlist = await Products.removeFromWishlist(userId, productId);
      return Responses.success(response, wishlist);
    } catch (error) {
      next(new Error());
    }
  }
}
