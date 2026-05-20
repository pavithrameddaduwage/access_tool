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

    console.log('--- Top 20 Users by log counts in power_bi_log ---');
    const res = await client.query(`
      SELECT "userId", COUNT(*) as count 
      FROM power_bi_log 
      GROUP BY "userId" 
      ORDER BY count DESC 
      LIMIT 20
    `);
    console.log(res.rows);

    console.log('--- Checking user_mapping table ---');
    const mappingRes = await client.query('SELECT COUNT(*) FROM user_mapping');
    console.log(`Table user_mapping has ${mappingRes.rows[0].count} rows`);
    if (parseInt(mappingRes.rows[0].count) > 0) {
      const sampleMap = await client.query('SELECT * FROM user_mapping LIMIT 20');
      console.log(sampleMap.rows);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
