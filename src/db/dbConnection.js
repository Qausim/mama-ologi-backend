import { Pool } from 'pg';

import environment from '../environment';


const { dbConnectionString: connectionString } = environment;
const pool = new Pool({ connectionString });

export default {
  dbConnect(query, data) {
    return pool.connect()
      .then((client) => client.query(query, data)
        .finally(() => client.release()));
  },
};
