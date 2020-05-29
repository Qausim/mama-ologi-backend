import User from '../models/user';
import Responses from '../utils/responseUtils';
import { getDebugger, debugHelper } from '../utils/debugUtils';


const debug = getDebugger('app:UserController');

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
      const wishlist = await User.getWishlist(userId);
      return Responses.success(response, wishlist);
    } catch (error) {
      debugHelper.error(debug, error);
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
      const wishlist = await User.getCart(userId);
      return Responses.success(response, wishlist);
    } catch (error) {
      debugHelper.error(debug, error);
      next(new Error());
    }
  }
}
