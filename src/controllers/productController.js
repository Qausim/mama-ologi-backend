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
    const { userId } = request.user;
    const { productId } = request.params;
    try {
      // Ensure the product exists else return a 404 error
      const product = await Products.getProduct(productId);
      if (!product) return Responses.notFoundError(response, 'Product not found');
      // Ensure the user has permission to delete the product (this may feel unnecessary now but
      // preparing for when there'll be need to scale)
      if (product.ownerId !== userId) {
        return Responses.forbiddenError(response, 'You are not permitted to delete the product');
      }
      // If there are images delete them from the third party service
      if (product.images.length) await CloudinaryService.deleteImages(product.images);

      // Delete from the records
      await Products.deleteProduct(productId);
      return Responses.success(response, { message: `"${product.title}" successfully deleted` });
    } catch (error) {
      next(new Error('Internal server error'));
    }
  }
}
