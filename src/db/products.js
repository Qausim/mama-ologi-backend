import dbConnection from './dbConnection';
import { productTableName } from './migration';


/**
 * Mimics a real life db table of products
 */
export default class Products {
  /**
   * Retrieves the existing products
   * @param {number} page
   * @returns {Promise - array} products
   */
  static async getProducts(page) {
    const perPage = page ? page * 10 : 10;
    return dbConnection.dbConnect(`SELECT * FROM ${productTableName} OFFSET $1 LIMIT 10`, [perPage - 10]);
  }

  /**
   * Adds a new product to the existing record of products
   * @param {object} product
   * @returns {Promise - object} product
   */
  static async addProduct(request) {
    let {
      title, price, priceDenomination, weight, weightUnit, description, images,
    } = request.body;
    [title, price, priceDenomination, weight, weightUnit, description, images] = [
      title, price, priceDenomination, weight, weightUnit, description, images,
    ].map((value) => {
      if (typeof value === 'string') return value.trim();
      return value;
    });
    const { userId: ownerId } = request.user;
    images = images || [];

    return dbConnection.dbConnect(
      `INSERT INTO ${productTableName} (
        owner_id, title, price, price_denomination, weight, weight_unit, description, images
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [ownerId, title, price, priceDenomination, weight, weightUnit, description, images],
    );
  }

  /**
   * Retrives a single product from the record of products using its id
   * @param {number} productId
   * @returns {object} product
   */
  static async getProduct(productId) {
    return dbConnection.dbConnect(`SELECT * FROM ${productTableName} WHERE id = $1`, [productId]);
  }

  /**
   * Deletes a product from the db using its id
   * @param {number} productId
   */
  static async deleteProduct(productId) {
    return dbConnection.dbConnect(`DELETE FROM ${productTableName} WHERE id = $1`, [productId]);
  }

  /**
   * Updates a product
   * @param {number} productId
   */
  static async updateProduct(query, data) {
    return dbConnection.dbConnect(query, data);
  }
}
