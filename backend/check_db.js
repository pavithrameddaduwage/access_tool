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
    console.log('Connected to PG database:', client.database);

    const tables = ['power_bi_log', 'user_dashboard', 'users', 'workspace', 'dashboard', 'workspace_mapping', 'report_mapping'];
    for (const table of tables) {
      try {
        const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
        console.log(`Table "${table}" has ${countRes.rows[0].count} rows`);
        if (parseInt(countRes.rows[0].count) > 0) {
          const sampleRes = await client.query(`SELECT * FROM "${table}" LIMIT 3`);
          console.log(`Sample from "${table}":`, sampleRes.rows);
        }
      } catch (e) {
        console.log(`Error checking table "${table}":`, e.message);
      }
    }
  } catch (err) {
    console.error('Error connecting to DB:', err);
  } finally {
    await client.end();
  }
}

main();
