/* eslint-disable no-console */
import dbConnection from './dbConnection';

import { userTableName, roleTableName, productTableName } from './migration';


const dropRoleTable = `DROP TABLE IF EXISTS ${roleTableName};`;
const dropUserTable = `DROP TABLE IF EXISTS ${userTableName};`;
const dropProductTable = `DROP TABLE IF EXISTS ${productTableName};`;

(async () => {
  try {
    await dbConnection.dbConnect(dropProductTable);
    await dbConnection.dbConnect(dropUserTable);
    await dbConnection.dbConnect(dropRoleTable);
  } catch (error) {
    console.log(error.message);
  }
})();
