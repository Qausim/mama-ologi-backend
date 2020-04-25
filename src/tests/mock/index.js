import dbConnection from '../../db/dbConnection';
import { productTableName, userTableName, roleTableName } from '../../db/migration';
import { productWithImages, productWithoutImages } from './product.mock';
import { mockUser } from './user.mock';
import { hashPassword } from '../../utils/authUtils';


dbConnection.dbConnect(
  `SELECT u.id FROM ${userTableName} AS u LEFT JOIN ${roleTableName} AS role ON u.role_id=role.id WHERE role.role='admin'`
)
  .then(({ rows: [{ id }] }) => {
    return dbConnection.dbConnect(`
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
      productWithoutImages.weightUnit, productWithoutImages.description, productWithoutImages.images
    ]);
  })
  .then(() => {
    return hashPassword(mockUser.password)
  })
  .then((password) => {
    const [first, rest] = mockUser.email.split('@');
    const email = [first + 199, rest].join('@');
    return dbConnection.dbConnect(
      `INSERT INTO ${userTableName} (
        email, password, first_name, last_name, address, street, phone, state, country
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) ON CONFLICT(email) DO UPDATE SET email=excluded.email RETURNING *`,
      [
        mockUser.email, password, mockUser.firstName, mockUser.lastName,
        mockUser.address, mockUser.street, mockUser.phone, mockUser.state, mockUser.country
      ]);
  })
  .catch((error) => console.log(error.message));
