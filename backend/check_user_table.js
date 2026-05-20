const { Client } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

async function main() {
  const client = new Client({
    host: process.env.PG_DB_HOST || 'localhost',
    port: parseInt(process.env.PG_DB_PORT || '5432', 10),
    database: process.env.PG_DB_NAME || 'access_tool',
    user: process.env.PG_DB_USER || 'postgres',
    password: process.env.PG_DB_PASSWORD || '0006'
  });

  try {
    await client.connect();
    console.log('Connected to PG');

    const countRes = await client.query('SELECT COUNT(*) FROM "user"');
    console.log(`Table "user" has ${countRes.rows[0].count} rows`);
    if (parseInt(countRes.rows[0].count) > 0) {
      const sampleRes = await client.query('SELECT * FROM "user" LIMIT 20');
      console.log(sampleRes.rows);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
