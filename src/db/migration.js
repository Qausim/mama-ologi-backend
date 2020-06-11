import dbConnection from './dbConnection';
import envVariables from '../environment';
import { hashPassword } from '../utils/authUtils';
import { getDebugger, debugHelper } from '../utils/debugUtils';
import {
  createUserRoleType, createUserTableQuery,
  insertAdminQuery, createProductTableQuery, createWishlistQuery,
  createGetWishlistFunctionQuery, adminRole, createGetCartFunctionQuery, createCartQuery,
} from '../utils/constants';


const debug = getDebugger('app:migration');
const { adminEmail, adminPassword: password } = envVariables;

(async () => {
  try {
    await dbConnection.dbConnect(createUserRoleType);
    const adminPassword = await hashPassword(password);
    await dbConnection.dbConnect(createUserTableQuery);
    await dbConnection.dbConnect(insertAdminQuery, [adminEmail, adminPassword, 'Olawumi', 'Yusuff', adminRole]);
    await dbConnection.dbConnect(createProductTableQuery);
    await dbConnection.dbConnect(createWishlistQuery);
    await dbConnection.dbConnect(createGetWishlistFunctionQuery);
    await dbConnection.dbConnect(createCartQuery);
    await dbConnection.dbConnect(createGetCartFunctionQuery);
  } catch (error) {
    debugHelper.error(debug, error);
  }
})();
