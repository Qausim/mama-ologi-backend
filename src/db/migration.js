import dbConnection from './dbConnection';
import envVariables from '../environment';
import { hashPassword } from '../utils/authUtils';
import {
  createRoleTableQuery, insertRole, selectAdminId,
  customerRole, selectCustomerId, createUserTableQuery,
  insertAdminQuery, createProductTableQuery, createWishlistQuery,
  createGetWishlistFunctionQuery, adminRole,
} from '../utils/constants';


const { adminEmail, adminPassword: password } = envVariables;

(async () => {
  try {
    await dbConnection.dbConnect(createRoleTableQuery);
    let adminId; let customerId;
    const { rows: adminRows, rowCount: adminCount } = await dbConnection
      .dbConnect(insertRole, [adminRole]);
    if (adminCount) adminId = adminRows[0].id;
    else {
      const { rows } = await dbConnection.dbConnect(selectAdminId);
      adminId = rows[0].id;
    }

    const { rows: customerRows, rowCount: customerCount } = await dbConnection
      .dbConnect(insertRole, [customerRole]);
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
