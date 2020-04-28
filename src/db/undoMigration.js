/* eslint-disable no-console */
import dbConnection from './dbConnection';

import {
  dropWishlistItemsTable, dropProductTable, dropUserTable, dropRoleTable, dropCartTable,
} from '../utils/constants';

(async () => {
  try {
    await dbConnection.dbConnect(dropCartTable);
    await dbConnection.dbConnect(dropWishlistItemsTable);
    await dbConnection.dbConnect(dropProductTable);
    await dbConnection.dbConnect(dropUserTable);
    await dbConnection.dbConnect(dropRoleTable);
  } catch (error) {
    console.log(error.message);
  }
})();
