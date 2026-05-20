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
    console.log('Connected to PG database for cleanup');

    console.log('Deleting all mock logs, user assignments, workspaces, and dashboards...');
    await client.query('TRUNCATE TABLE user_dashboard CASCADE');
    await client.query('TRUNCATE TABLE dashboard_workspace CASCADE');
    await client.query('DELETE FROM dashboard CASCADE');
    await client.query('DELETE FROM workspace CASCADE');
    await client.query('DELETE FROM power_bi_log CASCADE');

    console.log('All mock data has been deleted. The database is clean.');
  } catch (err) {
    console.error('Error cleaning database:', err);
  } finally {
    await client.end();
  }
}

main();
