const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
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
    console.log('Connected to PG database for seeding');

    // 1. Fetch workspace mappings and report mappings from DB
    const wmsRes = await client.query('SELECT * FROM workspace_mapping');
    const rmsRes = await client.query('SELECT * FROM report_mapping');
    
    const workspaceMappings = wmsRes.rows;
    const reportMappings = rmsRes.rows;
    
    console.log(`Found ${workspaceMappings.length} workspace mappings`);
    console.log(`Found ${reportMappings.length} report mappings`);

    // 2. Clear existing operational data - Removed to preserve historical records

    // 3. Seed workspaces (using displayName, fallback to originalName)
    const workspaceIdToDbId = {};
    for (const wm of workspaceMappings) {
      const name = wm.displayName || wm.originalName;
      const res = await client.query(
        'INSERT INTO workspace (workspace) VALUES ($1) ON CONFLICT (workspace) DO UPDATE SET workspace = EXCLUDED.workspace RETURNING id',
        [name]
      );
      workspaceIdToDbId[wm.workspaceId] = res.rows[0].id;
    }
    console.log(`Successfully seeded ${workspaceMappings.length} workspaces`);

    // 4. Seed dashboards (using displayName, fallback to originalName)
    const reportIdToDbId = {};
    for (const rm of reportMappings) {
      const name = rm.displayName || rm.originalName;
      const res = await client.query(
        'INSERT INTO dashboard (dashboard, "groupId") VALUES ($1, NULL) ON CONFLICT (dashboard) DO UPDATE SET dashboard = EXCLUDED.dashboard RETURNING id',
        [name]
      );
      reportIdToDbId[rm.reportId] = res.rows[0].id;
      
      // Also link to its workspace in dashboard_workspace
      const dbWorkspaceId = workspaceIdToDbId[rm.workspaceId];
      if (dbWorkspaceId) {
        // Check if the link already exists to prevent duplicates without truncating
        const linkCheck = await client.query(
          'SELECT id FROM dashboard_workspace WHERE "workspaceId" = $1 AND "dashboardId" = $2',
          [dbWorkspaceId, res.rows[0].id]
        );
        if (linkCheck.rows.length === 0) {
          await client.query(
            'INSERT INTO dashboard_workspace ("workspaceId", "dashboardId") VALUES ($1, $2)',
            [dbWorkspaceId, res.rows[0].id]
          );
        }
      }
    }
    console.log(`Successfully seeded ${reportMappings.length} dashboards and workspace links`);

    // 5. Seed user_dashboard permissions
    // Removed mock users seeding to eliminate hardcoded/mock data.

    // 6. Generate highly detailed mock Power BI logs for the past 90 days
    // Removed mock logs generation to eliminate hardcoded/mock data.

    console.log('Database seeding successfully completed!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await client.end();
  }
}

main();
