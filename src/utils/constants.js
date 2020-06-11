// DB table names
export const userTableName = 'users';
export const roleTypeName = 'roles';
export const productTableName = 'products';
export const wishlistTableName = 'wishlists';
export const cartTableName = 'carts';

// user roles
export const customerRole = 'customer';
export const adminRole = 'admin';

// DB queries
export const createUserRoleType = `
  DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='${roleTypeName}')
      THEN CREATE TYPE ${roleTypeName} AS ENUM ('${adminRole}', '${customerRole}');
      END IF;
    END
  $$;
`;

export const createUserTableQuery = `
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
    role ${roleTypeName} DEFAULT '${customerRole}'::${roleTypeName}
  );
`;

export const insertAdminQuery = `
  INSERT INTO ${userTableName} (
    email, password, first_name, last_name, role
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
    discount NUMERIC(3, 2) NOT NULL DEFAULT 0,
    weight NUMERIC(11, 2) NOT NULL,
    description VARCHAR(250) NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT false,
    stock SMALLINT NOT NULL DEFAULT 0,
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

export const createCartQuery = `
  CREATE TABLE IF NOT EXISTS ${cartTableName} (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    owner_id BIGINT REFERENCES ${userTableName} (id) NOT NULL,
    product_id BIGINT REFERENCES ${productTableName} (id) UNIQUE NOT NULL,
    quantity SMALLINT NOT NULL
  );
`;

export const createGetCartFunctionQuery = `
  CREATE OR REPLACE FUNCTION get_cart(user_id BIGINT) RETURNS json[] AS $cart$
    DECLARE cart json[];
    BEGIN
      SELECT ARRAY (
        SELECT row_to_json(c) FROM (
          SELECT user_cart.quantity, product.id AS product_id, product.title AS product_title,
          product.price AS product_price, product.price * user_cart.quantity as total_price,
          product.weight AS product_weight, product.weight * user_cart.quantity as total_weight FROM ${cartTableName} AS user_cart
          LEFT JOIN ${productTableName} AS product ON user_cart.product_id=product.id WHERE user_cart.owner_id=user_id
        ) AS c
      ) INTO cart;
      RETURN cart;
    END;
  $cart$ LANGUAGE plpgsql;
`;

export const dropRoleType = `DROP TYPE IF EXISTS ${roleTypeName};`;
export const dropUserTable = `DROP TABLE IF EXISTS ${userTableName};`;
export const dropProductTable = `DROP TABLE IF EXISTS ${productTableName};`;
export const dropWishlistItemsTable = `DROP TABLE IF EXISTS ${wishlistTableName}`;
export const dropCartTable = `DROP TABLE IF EXISTS ${cartTableName}`;


// Other constants
const generateRequiredAndOfMaxLengthError = (
  fieldName, maxLength,
) => `${fieldName} is required. Maximum length ${maxLength}`;
const nameError = ' name is required, as a sequence of letters hyphenated or not';

export const signinError = 'Invalid email or password';
export const productNotFoundError = 'Product not found';
export const invalidEmailError = 'Invalid email address';
export const imageUploadError = 'Error uploading images';
export const lastNameValidationError = `Last${nameError}`;
export const internalServerError = 'Internal server error';
export const phoneValidationError = 'Invalid phone number';
export const firstNameValidationError = `First${nameError}`;
export const accountConflictError = 'Account already exists';
export const maxImagesError = 'Maximum of 4 image files allowed';
export const emptyTokenError = 'You need to be signed in to perform this operation';
export const productNoImageError = 'There must be at least one image for a product';
export const passwordValidationError = 'Password must be at least 8 characters long';
export const stateValidationError = generateRequiredAndOfMaxLengthError('State', 50);
export const streetValidationError = generateRequiredAndOfMaxLengthError('Street', 80);
export const productDiscountValidationError = 'Discount must be a number from 0 through to 1';
export const quantityValidationError = 'quantity is required and should be an integer';
export const invalidTokenError = 'Unauthorized operation, please sign in and try again';
export const countryValidationError = generateRequiredAndOfMaxLengthError('Country', 50);
export const addressValidationError = generateRequiredAndOfMaxLengthError('Address', 150);
export const productDescriptionValidationError = "Please provide the product's description";
export const productPriceValidationError = 'Please enter a valid price (numeric) for the product';
export const productStockValidationError = 'A non zero whole number should be provided as "stock"';
export const productWeightValidationError = 'Please enter a valid weight (numeric) value for the product';
export const productCreationError = 'Unable to insert product, please ensure you have appropriate access';
export const maxImageSizeAndFormatError = 'Only jpeg and png images, each not greater than 2mb, are allowed';
export const productTitleValidationError = 'Please enter a valid title for the product (at least 6 characters)';
