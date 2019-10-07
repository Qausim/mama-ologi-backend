const products = [
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
  // /**
  //  * Retrieves the existing products
  //  * @returns {Promise - array} products
  //  */
  // static async getProducts() {
  //   return products;
  // }

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
}
