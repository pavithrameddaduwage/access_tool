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

    // 1. Get logs on May 20, 2026 local time
    const localTodayRes = await client.query(`
      SELECT "creationTime", "userId", "reportName", "workSpaceName"
      FROM power_bi_log
      WHERE "creationTime" >= '2026-05-19 18:30:00'
      ORDER BY "creationTime" DESC
    `);
    console.log('Logs on May 20 local time:');
    console.table(localTodayRes.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
