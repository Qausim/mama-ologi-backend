/* eslint-disable no-console */
import dbConnection from './dbConnection';

import {
  userTableName, roleTableName, productTableName, wishlistTableName,
} from './migration';


const dropRoleTable = `DROP TABLE IF EXISTS ${roleTableName};`;
const dropUserTable = `DROP TABLE IF EXISTS ${userTableName};`;
const dropProductTable = `DROP TABLE IF EXISTS ${productTableName};`;
// const dropWishlistTable = `DROP TABLE IF EXISTS ${wishlistTableName}`;
const dropWishlistItemsTable = `DROP TABLE IF EXISTS ${wishlistTableName}`;

(async () => {
  try {
    await dbConnection.dbConnect(dropWishlistItemsTable);
    // await dbConnection.dbConnect(dropWishlistTable);
    await dbConnection.dbConnect(dropProductTable);
    await dbConnection.dbConnect(dropUserTable);
    await dbConnection.dbConnect(dropRoleTable);
  } catch (error) {
    console.log(error.message);
  }
})();
