import Products from '../db/products';
import Responses from '../utils/responseUtils';

export default class UserController {
  /**
   * Retrieves a user's wishlist
   * @param {object} request
   * @param {object} response
   * @param {function} next
   */
  static async getWishlist(request, response, next) {
    const { userId } = request.user;
    try {
      const wishlist = await Products.getUserWishlist(userId);
      return Responses.success(response, wishlist);
    } catch (error) {
      next(new Error());
    }
  }

  /**
   * Retrieves a user's cart
   * @param {object} request
   * @param {object} response
   * @param {function} next
   */
  static async getCart(request, response, next) {
    const { userId } = request.user;
    try {
      const wishlist = await Products.getUserCart(userId);
      return Responses.success(response, wishlist);
    } catch (error) {
      next(new Error());
    }
  }
}
