import dbConnection from './dbConnection';
import {
  productTableName, userTableName, wishlistTableName, roleTableName,
} from './migration';


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
    const perPage = page * 10;
    return dbConnection.dbConnect(`SELECT *, images[1] FROM ${productTableName} OFFSET $1 LIMIT 10`, [perPage - 10]);
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
      ) SELECT $1, $2, $3, $4, $5, $6, $7, $8 WHERE (
        SELECT roles.role FROM ${userTableName} AS users LEFT JOIN ${roleTableName} AS roles ON users.role_id=roles.id WHERE users.id=$1
      )='admin' RETURNING *`,
      [ownerId, title, price, priceDenomination, weight, weightUnit, description, images],
    );
  }

  /**
   * Retrives a single product from the record of products using its id
   * @param {number} productId
   * @returns {object} product
   */
  static async getProduct(productId, method) {
    const query = method === 'get'
      ? `SELECT products.*, users.first_name, users.last_name, users.phone
          FROM ${productTableName} LEFT JOIN ${userTableName} ON users.id = products.owner_id WHERE products.id = $1`
      : `SELECT * FROM ${productTableName} WHERE id = $1`;
    return dbConnection.dbConnect(query, [productId]);
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
   * @param {string} query
   * @param {array} data
   */
  static async updateProduct(query, data) {
    return dbConnection.dbConnect(query, data);
  }

  /**
   * Adds a product to wishlist
   * @param {number} userId
   * @param {number} productId
   * @param {number} quantity
   */
  static async addToWishlist(userId, productId, quantity) {
    const query = `
      INSERT INTO ${wishlistTableName} (
        owner_id, product_id, quantity
      ) VALUES (
        $1, $2, $3
      ) ON CONFLICT (product_id) DO UPDATE SET quantity=GREATEST(
        ${wishlistTableName}.quantity, excluded.quantity
      ) RETURNING (SELECT get_wishlist($1) AS wishlist);
    `;
    return dbConnection.dbConnect(query, [userId, productId, quantity]);
  }

  /**
   * Retrieves all items in a user's wishlist
   * @param {number} userId
   */
  static async getUserWishlist(userId) {
    const { rows: [{ wishlist }] } = await dbConnection
      .dbConnect(
        'SELECT get_wishlist($1) AS wishlist', [userId],
      );
    return wishlist;
  }
}
