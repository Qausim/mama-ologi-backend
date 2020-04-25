import dbConnection from './dbConnection';
import envVariables from '../environment';
import { hashPassword } from '../utils/authUtils';


export const userTableName = 'users';
export const roleTableName = 'roles';
export const productTableName = 'products';
export const wishlistTableName = 'wishlists';


const { adminEmail, adminPassword: password } = envVariables;
const customerRole = 'customer';
const adminRole = 'admin';

const createRoleTableQuery = `
  CREATE TABLE IF NOT EXISTS ${roleTableName} (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    role VARCHAR(25) UNIQUE NOT NULL
  );
`;

const insertAdminRole = `
  INSERT INTO ${roleTableName} (role) VALUES ('${adminRole}') ON CONFLICT DO NOTHING RETURNING *;
`;

const insertCustomerRole = `
  INSERT INTO ${roleTableName} (role) values ('${customerRole}') ON CONFLICT DO NOTHING RETURNING *;
`;

const createUserTableQuery = (customerRoleId) => `
  CREATE TABLE IF NOT EXISTS ${userTableName} (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(250) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    address VARCHAR(150),
    street VARCHAR(80),
    state VARCHAR(50),
    country VARCHAR(50),
    role_id BIGINT REFERENCES roles (id) DEFAULT ${customerRoleId}
  );
`;

const insertAdminQuery = `
  INSERT INTO ${userTableName} (
    email, password, first_name, last_name, role_id
  ) VALUES (
    $1, $2, $3, $4, $5
  ) ON CONFLICT DO NOTHING;
`;


const createProductTableQuery = `
  CREATE TABLE IF NOT EXISTS ${productTableName} (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    owner_id BIGINT REFERENCES ${userTableName} (id) NOT NULL,
    title VARCHAR(50) NOT NULL,
    price NUMERIC(17, 2) NOT NULL,
    price_denomination VARCHAR(3) DEFAULT 'NGN' NOT NULL,
    weight NUMERIC(11, 2) NOT NULL,
    weight_unit VARCHAR(10) NOT NULL,
    description VARCHAR(250) NOT NULL,
    images TEXT[] DEFAULT '{}'
  );
`;

// export const insertProductQuery = `
//   INSERT INTO ${productTableName} (
//     owner_id, title, price, price_denomination, weight, weight_unit, description, images
//   ) VALUES (
//     $1, 'Yam pepper pap', 1200, 'NGN', 50, 'kg',
//     'Healthy energetic and blesses your day',
//     '{"image1.png", "image2.jpg"}'
//   ) RETURNING *;
// `;

const createWishlistQuery = `
  CREATE TABLE IF NOT EXISTS ${wishlistTableName} (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    owner_id BIGINT REFERENCES ${userTableName} (id) NOT NULL,
    product_id BIGINT REFERENCES ${productTableName} (id) UNIQUE NOT NULL,
    quantity SMALLINT NOT NULL
  );
`;

const createGetWishlistFunctionQuery = `
  CREATE OR REPLACE FUNCTION get_wishlist(user_id BIGINT) RETURNS json[] AS $wishes$
    DECLARE wishes json[];
    BEGIN
      SELECT ARRAY (
        SELECT row_to_json(w) FROM (
          SELECT user_wishes.quantity, product.title AS product_title, product.price AS product_price,
          product.price * user_wishes.quantity as total_price, product.weight AS product_weight,
          product.weight * user_wishes.quantity as total_weight FROM ${wishlistTableName} AS user_wishes
          LEFT JOIN ${productTableName} AS product ON user_wishes.product_id=product.id WHERE user_wishes.owner_id=user_id
        ) AS w
      ) INTO wishes;
      RETURN wishes;
    END;
  $wishes$ LANGUAGE plpgsql;
`;

export const selectAdminId = `SELECT id FROM ${roleTableName} WHERE role = 'admin'`;
export const selectCustomerId = `SELECT id FROM ${roleTableName} WHERE role = 'customer'`;

(async () => {
  try {
    await dbConnection.dbConnect(createRoleTableQuery);
    let adminId; let customerId;
    const { rows: adminRows, rowCount: adminCount } = await dbConnection.dbConnect(insertAdminRole);
    if (adminCount) adminId = adminRows[0].id;
    else {
      const { rows } = await dbConnection.dbConnect(selectAdminId);
      adminId = rows[0].id;
    }

    const { rows: customerRows, rowCount: customerCount } = await dbConnection
      .dbConnect(insertCustomerRole);
    if (customerCount) customerId = customerRows[0].id;
    else {
      const { rows } = await dbConnection.dbConnect(selectCustomerId);
      customerId = rows[0].id;
    }

    const adminPassword = await hashPassword(password);
    await dbConnection.dbConnect(createUserTableQuery(customerId));
    await dbConnection.dbConnect(insertAdminQuery, [adminEmail, adminPassword, 'Olawumi', 'Yusuff', adminId]);
    await dbConnection.dbConnect(createProductTableQuery);
    await dbConnection.dbConnect(createWishlistQuery);
    await dbConnection.dbConnect(createGetWishlistFunctionQuery);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error.message);
  }
})();
