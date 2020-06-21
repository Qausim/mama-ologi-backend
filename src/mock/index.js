import { debug as createDebugger } from 'debug';

import dbConnection from '../db/dbConnection';
import { productTableName, userTableName } from '../utils/constants';
import { productWithImages, productWithoutImages } from './product.mock';
import { mockUser } from './user.mock';
import { hashPassword } from '../utils/authUtils';
import User from '../models/user';
import { debugHelper } from '../utils/debugUtils';


const debug = createDebugger('app:mock');

dbConnection.dbConnect(
  `SELECT id FROM ${userTableName} WHERE role='admin'`,
)
  .then(({ rows: [{ id }] }) => dbConnection.dbConnect(`
    INSERT INTO ${productTableName} (
      owner_id, title, price, weight, description, images
    ) VALUES (
      $1, $2, $3, $4, $5, $6
    ), (
      $1, $7, $8, $9, $10, $11
    ), (
      $1, $2, $3, $4, $5, $6
    ), (
      $1, $7, $8, $9, $10, $11
    ), (
      $1, $2, $3, $4, $5, $6
    ), (
      $1, $7, $8, $9, $10, $11
    ) RETURNING *;  
  `,
  [
    id, productWithImages.title, productWithImages.price, productWithImages.weight,
    productWithImages.description, productWithImages.images, productWithoutImages.title,
    productWithoutImages.price, productWithoutImages.weight, productWithoutImages.description,
    productWithoutImages.images,
  ]))
  .then(() => hashPassword(mockUser.password))
  .then((password) => {
    const user = new User(
      mockUser.email, password, mockUser.firstName, mockUser.lastName,
      mockUser.phone, mockUser.address, mockUser.street, mockUser.state, mockUser.country,
    );
    return user.save();
  })
  .then(() => { throw new Error(); })
  .catch((error) => debugHelper.error(debug, error));
