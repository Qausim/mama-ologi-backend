import dbConnection from './dbConnection';
import envVariables from '../environment';
import { hashPassword } from '../utils/authUtils';
import {
  createUserRoleType, createUserTableQuery,
  insertAdminQuery, createProductTableQuery, createWishlistQuery,
  createGetWishlistFunctionQuery, adminRole,
} from '../utils/constants';


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
  } catch (error) {
    // eslint-disable-next-line no-console
    // console.log(error.message);
  }
})();
