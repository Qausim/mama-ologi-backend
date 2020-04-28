// DB table names
export const userTableName = 'users';
export const roleTableName = 'roles';
export const productTableName = 'products';
export const wishlistTableName = 'wishlists';

// user roles
export const customerRole = 'customer';
export const adminRole = 'admin';

// DB queries
export const createRoleTableQuery = `
  CREATE TABLE IF NOT EXISTS ${roleTableName} (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    role VARCHAR(25) UNIQUE NOT NULL
  );
`;

export const insertRole = `
  INSERT INTO ${roleTableName} (role) VALUES ($1) ON CONFLICT DO NOTHING RETURNING *;
`;

export const createUserTableQuery = (customerRoleId) => `
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

export const insertAdminQuery = `
  INSERT INTO ${userTableName} (
    email, password, first_name, last_name, role_id
  ) VALUES (
    $1, $2, $3, $4, $5
  ) ON CONFLICT DO NOTHING;
`;


export const createProductTableQuery = `
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

export const createWishlistQuery = `
  CREATE TABLE IF NOT EXISTS ${wishlistTableName} (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    owner_id BIGINT REFERENCES ${userTableName} (id) NOT NULL,
    product_id BIGINT REFERENCES ${productTableName} (id) UNIQUE NOT NULL,
    quantity SMALLINT NOT NULL
  );
`;

export const createGetWishlistFunctionQuery = `
  CREATE OR REPLACE FUNCTION get_wishlist(user_id BIGINT) RETURNS json[] AS $wishes$
    DECLARE wishes json[];
    BEGIN
      SELECT ARRAY (
        SELECT row_to_json(w) FROM (
          SELECT user_wishes.quantity, product.id AS product_id, product.title AS product_title,
          product.price AS product_price, product.price * user_wishes.quantity as total_price,
          product.weight AS product_weight, product.weight * user_wishes.quantity as total_weight FROM ${wishlistTableName} AS user_wishes
          LEFT JOIN ${productTableName} AS product ON user_wishes.product_id=product.id WHERE user_wishes.owner_id=user_id
        ) AS w
      ) INTO wishes;
      RETURN wishes;
    END;
  $wishes$ LANGUAGE plpgsql;
`;

export const selectAdminId = `SELECT id FROM ${roleTableName} WHERE role = 'admin'`;
export const selectCustomerId = `SELECT id FROM ${roleTableName} WHERE role = 'customer'`;
export const dropRoleTable = `DROP TABLE IF EXISTS ${roleTableName};`;
export const dropUserTable = `DROP TABLE IF EXISTS ${userTableName};`;
export const dropProductTable = `DROP TABLE IF EXISTS ${productTableName};`;
export const dropWishlistItemsTable = `DROP TABLE IF EXISTS ${wishlistTableName}`;

// Other constants
export const internalServerError = 'Internal server error';
export const quantityValidationError = 'quantity is required and should be an integer';
export const emptyTokenError = 'You need to be signed in to perform this operation';
export const invalidTokenError = 'Unauthorized operation, please sign in and try again';
export const productCreationError = 'Unable to insert product, please ensure you have appropriate access';
export const productNotFoundError = 'Product not found';
