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

    // 1. Get distinct UserIds (emails) from power_bi_log
    const res = await client.query('SELECT DISTINCT "userId" FROM power_bi_log WHERE "userId" IS NOT NULL');
    const emails = res.rows.map(r => r.userId.toLowerCase());
    console.log(`Found ${emails.length} unique users in the logs.`);

    // 2. Get the 'Viewer' role (or create it)
    let roleRes = await client.query("SELECT id FROM role_master WHERE role = 'Viewer'");
    let viewerRoleId;
    if (roleRes.rows.length > 0) {
      viewerRoleId = roleRes.rows[0].id;
    } else {
      const insertRole = await client.query("INSERT INTO role_master (role) VALUES ('Viewer') RETURNING id");
      viewerRoleId = insertRole.rows[0].id;
    }

    // 3. Insert users that don't exist
    for (const email of emails) {
      const userRes = await client.query('SELECT id FROM "user" WHERE email = $1', [email]);
      if (userRes.rows.length === 0) {
        const name = email.split('@')[0];
        const insertUser = await client.query(
          'INSERT INTO "user" (email, name, is_active) VALUES ($1, $2, true) RETURNING id',
          [email, name]
        );
        const userId = insertUser.rows[0].id;

        // Assign 'Viewer' role
        await client.query(
          'INSERT INTO user_roles ("userId", "roleId") VALUES ($1, $2)',
          [userId, viewerRoleId]
        );
        console.log(`Added user ${email}`);
      }
    }
    
    console.log('User sync complete!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
