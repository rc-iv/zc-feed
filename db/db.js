const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'zcfeed',
  password: process.env.NEXT_PUBLIC_DB_PASSWORD,
  port: 5432,
});

module.exports = pool;
