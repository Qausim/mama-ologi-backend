import Responses from '../utils/responseUtils';
import CloudinaryService from '../services/cloudinaryService';
import { productCreationError } from '../utils/constants';
import { prepareProductUpdateQuery } from '../utils/productUtils';
import Product from '../models/product';
import { getDebugger, debugHelper } from '../utils/debugUtils';

const debug = getDebugger('app:ProductController');
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
      const {
        user: { userId },
        body: {
          title, price, discount, weight, description, stock, images,
        },
      } = request;
      const newProduct = new Product(
        userId, title, price, weight, description, stock, discount, images,
      );
      const res = await newProduct.save();
      return res
        ? Responses.success(response, res, 201)
        : Responses.forbiddenError(response, productCreationError);
    } catch (error) {
      debugHelper.error(debug, error);
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
      if (product.images.length) await CloudinaryService.deleteImages(product.images.slice(1));

      // Delete from the records
      await Product.deleteById(productId, product.images.slice(0, 1));
      return Responses.success(response, { message: `"${product.title}" successfully deleted` });
    } catch (error) {
      debugHelper.error(debug, error);
      next(new Error());
    }
  }

  /**
   * @param {object} request
   * @param {object} response
   * @param {callback} next
   */
  static async updateProduct(request, response, next) {
    const { preparedQuery, preparedData } = prepareProductUpdateQuery(request);
    try {
      const product = await Product.updateProduct(preparedQuery, preparedData);
      return Responses.success(response, product);
    } catch (error) {
      debugHelper.error(debug, error);
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
      const products = await Product.getPaginatedList(page);
      return Responses.success(response, products);
    } catch (error) {
      debugHelper.error(debug, error);
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
      const wishlist = await Product.addToWishList(userId, productId, quantity);
      return Responses.success(response, wishlist, 200);
    } catch (error) {
      debugHelper.error(debug, error);
      next(new Error());
    }
  }

  /**
   * Removes an item from a user's wishlist
   * @param {object} request
   * @param {object} response
   * @param {function} next
   */
  static async removeFromWishlist(request, response, next) {
    const { user: { userId }, params: { productId } } = request;
    try {
      const wishlist = await Product.removeFromWishlist(userId, productId);
      return Responses.success(response, wishlist);
    } catch (error) {
      debugHelper.error(debug, error);
      next(new Error());
    }
  }

  /**
   * Adds a product to cart
   * @param {object} request
   * @param {object} response
   * @param {function} next
   */
  static async addToCart(request, response, next) {
    const { user: { userId }, params: { productId }, body: { quantity } } = request;
    try {
      const cart = await Product.addToCart(userId, productId, quantity);
      return Responses.success(response, cart, 200);
    } catch (error) {
      debugHelper.error(debug, error);
      next(new Error());
    }
  }

  /**
   * Removes an item from a user's cart
   * @param {object} request
   * @param {object} response
   * @param {function} next
   */
  static async removeFromCart(request, response, next) {
    const { user: { userId }, params: { productId } } = request;
    try {
      const cart = await Product.removeFromCart(userId, productId);
      return Responses.success(response, cart);
    } catch (error) {
      debugHelper.error(debug, error);
      next(new Error());
    }
  }
}
