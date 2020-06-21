import dbConnection from '../db/dbConnection';
import {
  productTableName, userTableName, wishlistTableName, cartTableName,
} from '../utils/constants';


export default class Product {
  constructor(
    ownerId, title, price, weight,
    description, stock, discount = 0, images = [],
  ) {
    this.ownerId = ownerId;
    this.title = title;
    this.price = price;
    this.discount = discount;
    this.weight = weight;
    this.description = description;
    this.stock = stock;
    this.images = images;
  }

  /**
   * Saves a new product
   * @returns {object} product
   */
  async save() {
    const { rows: [res] } = await dbConnection.dbConnect(
      `INSERT INTO ${productTableName} (
        owner_id, title, price, stock, discount, weight, description, images
      ) SELECT $1, $2, $3, $4, $5, $6, $7, $8 WHERE (
        SELECT role FROM ${userTableName} WHERE id=$1
      )='admin' RETURNING *`,
      [
        this.ownerId, this.title, this.price, this.stock,
        this.discount, this.weight, this.description, this.images,
      ],
    );

    return res;
  }

  /**
   * Retrieves a single product by its id
   * @param {number} productId
   * @param {string} method
   */
  static async findById(productId, method) {
    const query = method === 'get'
      ? `
          SELECT p.*, users.first_name, users.last_name, users.phone
          FROM ${productTableName} p INNER JOIN ${userTableName}
          ON users.id = p.owner_id WHERE p.id = $1 AND p.deleted = false;
        `
      : `SELECT * FROM ${productTableName} WHERE id = $1`;
    const { rows: [res] } = await dbConnection.dbConnect(query, [productId]);
    if (res) delete res.deleted;
    return res;
  }

  /**
   * Retrieves the existing products
   * @param {number} page
   * @returns {array} products
   */
  static async getPaginatedList(page) {
    const pageEnd = page * 12;
    const { rows } = await dbConnection.dbConnect(
      `SELECT id, title, price, weight, description, stock, discount, images[1], (
        SELECT CEIL(COUNT(id)::NUMERIC / 12) page_count FROM ${productTableName} WHERE deleted = false
      ) FROM ${productTableName} WHERE deleted = false  OFFSET $1 LIMIT 12;`,
      [pageEnd - 12],
    );

    return rows;
  }

  /**
   * Deletes a product from the db using its id`
   * @param {number} productId
   */
  static async deleteById(productId, images = []) {
    return dbConnection.dbConnect(
      `UPDATE ${productTableName} SET deleted = true, images = $2 WHERE id = $1`,
      [productId, images],
    );
  }

  /**
   * Updates a product
   * @param {string} updateQuery
   * @param {array} updateData
   * @returns {object}
   */
  static async updateProduct(updateQuery, updateData) {
    const { rows: [res] } = await dbConnection.dbConnect(updateQuery, updateData);
    return res;
  }

  /**
   * Inserts a product into the user's wishlist or updates the quantity if more
   * @param {number} userId
   * @param {number} productId
   * @return {array} wishlist
   */
  static async addToWishList(userId, productId) {
    const query = `
      INSERT INTO ${wishlistTableName} (
        owner_id, product_id
      ) VALUES (
        $1, $2
      ) ON CONFLICT (product_id) DO UPDATE SET product_id=excluded.product_id
      RETURNING (SELECT get_wishlist($1) AS wishlist);
    `;

    const { rows: [{ wishlist }] } = await dbConnection
      .dbConnect(query, [userId, productId]);
    return wishlist;
  }

  /**
   * Removes a product from the user's wishlist
   * @param {number} userId
   * @param {number} productId
   * @returns {array} wishlist
   */
  static async removeFromWishlist(userId, productId) {
    const { rows: [{ wishlist }] } = await dbConnection.dbConnect(
      `
        DELETE FROM ${wishlistTableName} WHERE owner_id=$1 AND product_id=$2
        RETURNING get_wishlist($1) AS wishlist;
      `,
      [userId, productId],
    );
    return wishlist;
  }

  /**
   * Adds a product to the user's cart or update the quantity if more
   * @param {number} userId
   * @param {number} productId
   * @param {number} quantity
   * @returns {array} cart
   */
  static async addToCart(userId, productId, quantity) {
    const query = `
      INSERT INTO ${cartTableName} (
        owner_id, product_id, quantity
      ) VALUES (
        $1, $2, $3
      ) ON CONFLICT (product_id) DO UPDATE SET quantity=GREATEST(
        ${cartTableName}.quantity, excluded.quantity
        ) RETURNING (SELECT get_cart($1) AS cart);
    `;
    const { rows: [{ cart }] } = await dbConnection.dbConnect(query, [userId, productId, quantity]);
    return cart;
  }

  /**
   * Removes a product from user's cart
   * @param {number} userId
   * @param {number} productId
   */
  static async removeFromCart(userId, productId) {
    const { rows: [{ cart }] } = await dbConnection.dbConnect(
      `
        DELETE FROM ${cartTableName} WHERE owner_id=$1 AND product_id=$2 RETURNING get_cart($1) AS cart
      `,
      [userId, productId],
    );
    return cart;
  }
}
