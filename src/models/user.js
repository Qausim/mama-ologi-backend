import { userTableName } from '../utils/constants';
import dbConnection from '../db/dbConnection';


export default class User {
  constructor(
    email, password, firstName, lastName, phone,
    address, street, state, country = 'Nigeria',
  ) {
    this.email = email;
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.address = address;
    this.street = street;
    this.state = state;
    this.country = country;
  }

  /**
   * Saves a new user
   * @returns object
   */
  async save() {
    const { rows: [res] } = await dbConnection.dbConnect(
      `INSERT INTO ${userTableName} (
        email, password, first_name, last_name, phone, address, street, state, country
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) returning id, email, first_name, last_name, phone, address, street, state, country, role`,
      [
        this.email, this.password, this.firstName, this.lastName,
        this.phone, this.address, this.street, this.state, this.country,
      ],
    );

    return res;
  }

  static async findByEmail(email) {
    const { rows: [res] } = await dbConnection.dbConnect(
      `SELECT * FROM ${userTableName}, get_wishlist(id) AS wishlist, get_cart(id) AS cart WHERE email=$1`,
      [email],
    );

    return res;
  }

  /**
   * Retrieves all items in a user's wishlist
   * @param {number} userId
   */
  static async getWishlist(userId) {
    const { rows: [{ wishlist }] } = await dbConnection
      .dbConnect(
        'SELECT get_wishlist($1) AS wishlist', [userId],
      );
    return wishlist;
  }

  /**
   * Retrieves all items in a user's cart
   * @param {number} userId
   */
  static async getCart(userId) {
    const { rows: [{ cart }] } = await dbConnection
      .dbConnect(
        'SELECT get_cart($1) AS cart', [userId],
      );
    return cart;
  }
}
