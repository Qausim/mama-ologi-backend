import Products from '../db/products';
import Responses from '../utils/responseUtils';

export default class UserController {
  static async getWishlist(request, response, next) {
    const { userId } = request.user;
    try {
      const wishlist = await Products.getUserWishlist(userId);
      return Responses.success(response, wishlist);
    } catch (error) {
      next(new Error());
    }
  }
}
