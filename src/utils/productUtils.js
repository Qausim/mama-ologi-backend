/* eslint-disable import/prefer-default-export */
import { productTableName } from './constants';


/**
 * Prepares the update and product data for a product
 * @param {object} request
 * @returns {object}
 */
export const prepareProductUpdateQuery = (request) => {
  const { productId } = request.params;
  const expectedFields = ['title', 'price', 'priceDenomination', 'weight', 'weightUnit', 'description', 'images'];
  const body = [];
  expectedFields.forEach((field) => {
    const value = request.body[field];
    if (value) {
      // eslint-disable-next-line no-nested-ternary
      const key = field === 'priceDenomination' ? 'price_denomination' : field === 'weightUnit' ? 'weight_unit' : field;
      body.push([
        key, typeof value === 'string' ? value.trim() : value,
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
  preparedQuery = `UPDATE ${productTableName} SET ${preparedQuery}WHERE id = $${preparedData.length + 1} RETURNING *`;
  preparedData.push(productId);
  return { preparedQuery, preparedData };
};
