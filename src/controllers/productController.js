import Products from '../db/products';
import Responses from '../utils/responseUtils';

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

      const product = await Products.addProduct(newProduct);
      Responses.success(response, product, 201);
    } catch (error) {
      next(new Error());
    }
  }
}
