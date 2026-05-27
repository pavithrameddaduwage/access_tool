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
    const userId = 'PMeddaduwage@hgusa.com';
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    console.log('Querying logs for user:', userId, 'from', startDate.toISOString(), 'to', endDate.toISOString());

    // exact fallback query in sql
    const sql = `
      SELECT 
        "log"."reportId" AS "reportId", 
        "log"."reportName" AS "reportName", 
        "log"."workspaceId" AS "workspaceId", 
        "log"."workSpaceName" AS "workspaceName", 
        COUNT("log"."id") * 120 AS "totalSeconds"
      FROM "power_bi_log" "log"
      WHERE LOWER("log"."userId") = LOWER($1)
        AND "log"."creationTime" BETWEEN $2 AND $3
        AND "log"."operation" = 'ViewReport'
      GROUP BY "log"."reportId", "log"."reportName", "log"."workspaceId", "log"."workSpaceName"
    `;

    const res = await client.query(sql, [userId, startDate, endDate]);
    console.log('Fallback Query Results:', res.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
