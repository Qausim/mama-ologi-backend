import dbConnection from './dbConnection';

import {
  dropWishlistItemsTable, dropProductTable, dropUserTable, dropRoleType, dropCartTable,
} from '../utils/constants';
import { getDebugger, debugHelper } from '../utils/debugUtils';

const debug = getDebugger('app:undoMigration');

(async () => {
  try {
    await dbConnection.dbConnect(dropCartTable);
    await dbConnection.dbConnect(dropWishlistItemsTable);
    await dbConnection.dbConnect(dropProductTable);
    await dbConnection.dbConnect(dropUserTable);
    await dbConnection.dbConnect(dropRoleType);
  } catch (error) {
    debugHelper.error(debug, error);
  }
})();
