/* eslint-disable eqeqeq */
let products = [
  {
    id: 1,
    ownerId: 1,
    title: 'Yam pepper pap',
    price: {
      value: '1200',
      denomination: 'NGN',
    },
    weight: {
      value: 50,
      unit: 'kg',
    },
    description: 'Healthy energetic and blesses your day',
    images: ['image1.png', 'image2.jpg'],
  },
];

/**
 * Mimics a real life db table of products
 */
export default class Products {
  /**
   * Retrieves the existing products
   * @returns {Promise - array} products
   */
  static async getProducts() {
    return products;
  }

  /**
   * Adds a new product to the existing record of products
   * @param {object} product
   * @returns {Promise - object} product
   */
  static async addProduct(product) {
    // eslint-disable-next-line no-param-reassign
    product.id = products.length ? products[products.length - 1].id + 1 : 1;
    products.push(product);
    return product;
  }

  /**
   * Retrives a single product from the record of products using its id
   * @param {number} productId
   * @returns {object} product
   */
  static async getProduct(productId) {
    return products.find((product) => product.id == productId);
  }

  /**
   * Deletes a product from the db using its id
   * @param {number} productId
   */
  static async deleteProduct(productId) {
    products = products.filter((product) => product.id != productId);
  }
}
