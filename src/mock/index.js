import dbConnection from '../db/dbConnection';
import { productTableName, userTableName } from '../utils/constants';
import { productWithImages, productWithoutImages } from './product.mock';
import { mockUser } from './user.mock';
import { hashPassword } from '../utils/authUtils';


dbConnection.dbConnect(
  `SELECT id FROM ${userTableName} WHERE role='admin'`,
)
  .then(({ rows: [{ id }] }) => dbConnection.dbConnect(`
    INSERT INTO ${productTableName} (
      owner_id, title, price, price_denomination, weight, weight_unit, description, images
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8
    ), (
      $1, $9, $10, $11, $12, $13, $14, $15
    ), (
      $1, $2, $3, $4, $5, $6, $7, $8
    ), (
      $1, $9, $10, $11, $12, $13, $14, $15
    ), (
      $1, $2, $3, $4, $5, $6, $7, $8
    ), (
      $1, $9, $10, $11, $12, $13, $14, $15
    ) RETURNING *;  
  `,
  [
    id, productWithImages.title, productWithImages.price, productWithImages.priceDenomination,
    productWithImages.weight, productWithImages.weightUnit, productWithImages.description,
    productWithImages.images, productWithoutImages.title, productWithoutImages.price,
    productWithoutImages.priceDenomination, productWithoutImages.weight,
    productWithoutImages.weightUnit, productWithoutImages.description, productWithoutImages.images,
  ]))
  .then(() => hashPassword(mockUser.password))
  .then((password) => dbConnection.dbConnect(
    `INSERT INTO ${userTableName} (
      email, password, first_name, last_name, address, street, phone, state, country
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) ON CONFLICT(email) DO UPDATE SET email=excluded.email RETURNING *`,
    [
      mockUser.email, password, mockUser.firstName, mockUser.lastName,
      mockUser.address, mockUser.street, mockUser.phone, mockUser.state, mockUser.country,
    ],
  ));
// .catch((error) => console.log(error.message));
