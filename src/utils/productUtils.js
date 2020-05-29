/* eslint-disable import/prefer-default-export */
import { productTableName } from './constants';


/**
 * Prepares the update and product data for a product
 * @param {object} request
 * @returns {object}
 */
export const prepareProductUpdateQuery = (request) => {
  const { productId } = request.params;
  const expectedFields = ['title', 'price', 'weight', 'description', 'images', 'discount', 'stock'];
  const body = [];
  expectedFields.forEach((field) => {
    const value = request.body[field];
    if (value) {
      body.push([
        field, typeof value === 'string' ? value.trim() : value,
      ]);
    }
  });
  let preparedQuery = '';
  const preparedData = [];
  body.forEach(([key, value], index) => {
    preparedQuery += `${key} = $${index + 1}`;
    preparedQuery += index === body.length - 1 ? ' ' : ', ';
    preparedData.push(value);
  });
  preparedQuery = `UPDATE ${productTableName} SET ${preparedQuery}WHERE id = $${preparedData.length + 1}
  AND deleted = false RETURNING id, title, price, owner_id, discount, weight, description, stock, images`;
  preparedData.push(productId);
  return { preparedQuery, preparedData };
};
