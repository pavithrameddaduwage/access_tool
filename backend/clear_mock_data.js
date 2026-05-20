const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'walmart_db',
    user: 'postgres',
    password: '0006'
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
