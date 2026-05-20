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

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = tablesRes.rows.map(r => r.table_name);

    for (const table of tables) {
      // Get all columns of the table
      const colsRes = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
      `, [table]);

      const textCols = colsRes.rows
        .filter(c => ['character varying', 'text', 'character'].includes(c.data_type))
        .map(c => `"${c.column_name}"`);

      if (textCols.length === 0) continue;

      const whereClause = textCols.map(col => `${col} ILIKE '%Sajith%' OR ${col} ILIKE '%Bandara%'`).join(' OR ');
      try {
        const searchRes = await client.query(`SELECT COUNT(*) FROM "${table}" WHERE ${whereClause}`);
        const count = parseInt(searchRes.rows[0].count, 10);
        if (count > 0) {
          console.log(`Found ${count} rows matching Sajith/Bandara in table "${table}"`);
          const samples = await client.query(`SELECT * FROM "${table}" WHERE ${whereClause} LIMIT 5`);
          console.log(samples.rows);
        }
      } catch (e) {
        // console.error(`Error querying table ${table}:`, e.message);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
