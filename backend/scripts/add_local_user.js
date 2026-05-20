// scripts/add_local_user.js
// Usage: node scripts/add_local_user.js <email> "Display Name"

const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const email = process.argv[2] || 'pmeddaduwage@hgusa.com';
const name = process.argv[3] || 'Pavithra Meddaduwage';

const rolesToEnsure = [
  'Admin',
  'Viewer',
  'user',
  'admin',
  'superadmin',
  'SuperAdmin'
];

async function main() {
  const client = new Client({
    host: process.env.PG_DB_HOST || 'localhost',
    port: parseInt(process.env.PG_DB_PORT || '5432', 10),
    user: process.env.PG_DB_USER || 'postgres',
    password: process.env.PG_DB_PASSWORD || '',
    database: process.env.PG_DB_NAME || 'access_tool'
  });

  await client.connect();
  try {
    await client.query('BEGIN');

    // Ensure roles exist and collect their ids
    const roleIds = {};
    for (const r of rolesToEnsure) {
      const res = await client.query('SELECT id FROM role_master WHERE role = $1', [r]);
      if (res.rowCount > 0) {
        roleIds[r] = res.rows[0].id;
      } else {
        const ins = await client.query('INSERT INTO role_master (role) VALUES ($1) RETURNING id', [r]);
        roleIds[r] = ins.rows[0].id;
      }
    }

    // Insert user if not exists
    const userRes = await client.query('SELECT id FROM "user" WHERE email = $1', [email.toLowerCase()]);
    let userId;
    if (userRes.rowCount > 0) {
      userId = userRes.rows[0].id;
      console.log('User already exists with id', userId);
    } else {
      const insUser = await client.query('INSERT INTO "user" (email, name, is_active) VALUES ($1, $2, true) RETURNING id', [email.toLowerCase(), name]);
      userId = insUser.rows[0].id;
      console.log('Inserted user id', userId);
    }

    // Assign all roles to user (avoid duplicates)
    for (const [roleName, rid] of Object.entries(roleIds)) {
      const exists = await client.query('SELECT id FROM user_roles WHERE "userId" = $1 AND "roleId" = $2', [userId, rid]);
      if (exists.rowCount === 0) {
        await client.query('INSERT INTO user_roles ("userId", "roleId") VALUES ($1, $2)', [userId, rid]);
        console.log(`Assigned role ${roleName} to user`);
      }
    }

    await client.query('COMMIT');
    console.log('Done. User', email, 'has been set up with roles.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
