const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

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
    console.log('Connected to PG database for seeding');

    // 1. Fetch workspace mappings and report mappings from DB
    const wmsRes = await client.query('SELECT * FROM workspace_mapping');
    const rmsRes = await client.query('SELECT * FROM report_mapping');
    
    const workspaceMappings = wmsRes.rows;
    const reportMappings = rmsRes.rows;
    
    console.log(`Found ${workspaceMappings.length} workspace mappings`);
    console.log(`Found ${reportMappings.length} report mappings`);

    // 2. Clear existing operational data
    console.log('Clearing old user_dashboard, dashboard_workspace, dashboard, workspace, and power_bi_log...');
    await client.query('TRUNCATE TABLE user_dashboard CASCADE');
    await client.query('TRUNCATE TABLE dashboard_workspace CASCADE');
    // We want to safely truncate dashboard and workspace, but they might be foreign-keyed
    await client.query('DELETE FROM dashboard CASCADE');
    await client.query('DELETE FROM workspace CASCADE');
    await client.query('DELETE FROM power_bi_log CASCADE');

    // Reset sequences
    await client.query('ALTER SEQUENCE IF EXISTS workspace_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE IF EXISTS dashboard_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE IF EXISTS dashboard_workspace_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE IF EXISTS user_dashboard_id_seq RESTART WITH 1');

    // 3. Seed workspaces (using displayName, fallback to originalName)
    const workspaceIdToDbId = {};
    for (const wm of workspaceMappings) {
      const name = wm.displayName || wm.originalName;
      const res = await client.query(
        'INSERT INTO workspace (workspace) VALUES ($1) RETURNING id',
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
        'INSERT INTO dashboard (dashboard, "groupId") VALUES ($1, NULL) RETURNING id',
        [name]
      );
      reportIdToDbId[rm.reportId] = res.rows[0].id;
      
      // Also link to its workspace in dashboard_workspace
      const dbWorkspaceId = workspaceIdToDbId[rm.workspaceId];
      if (dbWorkspaceId) {
        await client.query(
          'INSERT INTO dashboard_workspace ("workspaceId", "dashboardId") VALUES ($1, $2)',
          [dbWorkspaceId, res.rows[0].id]
        );
      }
    }
    console.log(`Successfully seeded ${reportMappings.length} dashboards and workspace links`);

    // 5. Seed user_dashboard permissions
    const users = [
      { email: 'TBrown@hgusa.com', name: 'Thomas Brown', dept: 'Executive' },
      { email: 'CDevinda@hgusa.com', name: 'Chamara Devinda', dept: 'IT Services' },
      { email: 'ralmerini@hgusa.com', name: 'Ricardo Almerini', dept: 'Finance' },
      { email: 'SBandara@hgusa.com', name: 'Sajith Bandara', dept: 'Warehouse Operations' },
      { email: 'rperera@hgusa.com', name: 'Ruwan Perera', dept: 'Sourcing' },
      { email: 'bhom@hgusa.com', name: 'Brandon Hom', dept: 'POS Administration' },
      { email: 'DRajaratnam@hgusa.com', name: 'Dilshan Rajaratnam', dept: 'Executive Office' },
      { email: 'UUpamalika@hgusa.com', name: 'Upekkha Upamalika', dept: 'Sales' },
      { email: 'BPutruele@hgusa.com', name: 'Bruno Putruele', dept: 'Finance' },
      { email: 'csenavirathne@hgusa.com', name: 'Chathura Senavirathne', dept: 'Warehouse Operations' },
      { email: 'cloud.zhang@hgusa.com', name: 'Cloud Zhang', dept: 'Inventory Control' },
      { email: 'NilanthaW@hgusa.com', name: 'Nilantha Wijesinghe', dept: 'IT' },
      { email: 'cduncan@hgusa.com', name: 'Connor Duncan', dept: 'Sales' },
      { email: 'RChuako@hgusa.com', name: 'Ramon Chuako', dept: 'Executive' },
      { email: 'ewade@hgusa.com', name: 'Emily Wade', dept: 'Finance' },
      { email: 'RLiyanage@hgusa.com', name: 'Ranga Liyanage', dept: 'Warehouse' },
      { email: 'RMuhammad@hgusa.com', name: 'Rizwan Muhammad', dept: 'Sourcing' },
      { email: 'emarulli@hgusa.com', name: 'Enrique Marulli', dept: 'Executive' },
      { email: 'DCASTELLANOS@hgusa.com', name: 'David Castellanos', dept: 'Sales' },
      { email: 'IKotuwewatta@hgusa.com', name: 'Indika Kotuwewatta', dept: 'Warehouse' },
      { email: 'kerry.gable@thebarcodegroup.com', name: 'Kerry Gable', dept: 'External Partner' },
      { email: 'RHemachandra@hgusa.com', name: 'Roshan Hemachandra', dept: 'Sourcing' },
      { email: 'CSenarathYapa@hgusa.com', name: 'Charith Senarath Yapa', dept: 'Sales' },
      { email: 'DRasanjani@hgusa.com', name: 'Dilini Rasanjani', dept: 'POS Team' },
      { email: 'dlerner@hgusa.com', name: 'Daniel Lerner', dept: 'Finance' },
      { email: 'MGunasekara@hgusa.com', name: 'Mahesh Gunasekara', dept: 'Warehouse' },
      { email: 'dnalinda@hgusa.com', name: ' Nalinda Dias', dept: 'Inventory' },
      { email: 'AMEYER@hgusa.com', name: 'Alexander Meyer', dept: 'Sales' },
      { email: 'dineshd@hgusa.com', name: 'Dinesh Dharmadasa', dept: 'Sourcing' }
    ];

    console.log('Seeding user_dashboard permissions...');
    for (const u of users) {
      // Assign each user to 4-10 random dashboards
      const numDashboards = 4 + Math.floor(Math.random() * 7);
      const shuffledReports = [...reportMappings].sort(() => 0.5 - Math.random());
      const selectedReports = shuffledReports.slice(0, numDashboards);
      
      for (const rep of selectedReports) {
        const dbId = reportIdToDbId[rep.reportId];
        const isActive = Math.random() > 0.08; // 8% chance of being an inactive assignment to show deactivated logic
        const lastActiveAt = isActive ? null : new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        
        await client.query(
          `INSERT INTO user_dashboard (email, "userName", department, "dashboardId", "isActive", "lastActiveAt") 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [u.email, u.name, u.dept, dbId, isActive, lastActiveAt]
        );
      }
    }
    console.log(`Seeded user_dashboard permissions for ${users.length} users`);

    // 6. Generate highly detailed mock Power BI logs for the past 90 days
    console.log('Generating past 90 days mock Power BI logs...');
    const now = new Date();
    const logs = [];

    // Make sure we have logs from Feb 20, 2026 to May 20, 2026
    for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
      const logDay = new Date(now);
      logDay.setDate(now.getDate() - dayOffset);
      
      // Determine if weekend
      const dayOfWeek = logDay.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Generate random logs count for this day
      const numLogs = isWeekend ? (2 + Math.floor(Math.random() * 5)) : (25 + Math.floor(Math.random() * 40));
      
      for (let i = 0; i < numLogs; i++) {
        // Pick a random user
        const u = users[Math.floor(Math.random() * users.length)];
        
        // Pick a random report mapping
        const rep = reportMappings[Math.floor(Math.random() * reportMappings.length)];
        const ws = workspaceMappings.find(w => w.workspaceId === rep.workspaceId) || { originalName: 'HGU Executive Workspace', workspaceId: rep.workspaceId };
        
        // Set exact timestamp
        const hour = 8 + Math.floor(Math.random() * 10); // Between 8 AM and 6 PM
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);
        const creationTime = new Date(logDay);
        creationTime.setHours(hour, minute, second, 0);

        // To generate sessions (time spent), sometimes add another log a few minutes later
        const hasFollowUp = Math.random() > 0.4;
        const count = hasFollowUp ? 2 : 1;
        
        for (let c = 0; c < count; c++) {
          const actualTime = new Date(creationTime);
          if (c > 0) {
            actualTime.setMinutes(actualTime.getMinutes() + 1 + Math.floor(Math.random() * 12));
          }
          
          logs.push({
            id: uuidv4(),
            recordType: 20,
            creationTime: actualTime.toISOString(),
            userType: 0,
            isSuccess: true,
            storedAt: new Date().toISOString(),
            userId: u.email,
            clientIP: `192.168.1.${10 + Math.floor(Math.random() * 200)}`,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            activity: 'ViewReport',
            itemName: rep.originalName,
            workSpaceName: ws.originalName,
            datasetName: rep.originalName + ' Dataset',
            reportName: rep.originalName,
            capacityId: 'capacity-1298402-abc',
            capacityName: 'HGU Capacity A',
            workspaceId: rep.workspaceId,
            objectId: `report-${rep.reportId}`,
            datasetId: `dataset-${uuidv4().substring(0,8)}`,
            reportId: rep.reportId,
            artifactId: rep.reportId,
            artifactName: rep.originalName,
            artifactKind: 'Report',
            reportType: 'PowerBIReport',
            requestId: `req-${uuidv4().substring(0,8)}`,
            activityId: `act-${uuidv4().substring(0,8)}`,
            distributionMethod: 'Workspace',
            operation: 'ViewReport',
            organizationId: '71c8f86c-f58f-4215-9e24-cd06e1e95ea8',
            consumptionMethod: Math.random() > 0.3 ? 'PowerBIWeb' : 'PowerBIMobile',
            userKey: u.email,
            workload: 'PowerBI'
          });
        }
      }
    }

    console.log(`Generated ${logs.length} logs. Inserting in batches...`);
    
    // Batch insert logs into pg
    const BATCH_SIZE = 200;
    for (let i = 0; i < logs.length; i += BATCH_SIZE) {
      const batch = logs.slice(i, i + BATCH_SIZE);
      
      const insertQueries = batch.map(log => {
        return client.query(
          `INSERT INTO power_bi_log (
            id, "recordType", "creationTime", "userType", "isSuccess", "storedAt", "userId", 
            "clientIP", "userAgent", activity, "itemName", "workSpaceName", "datasetName", 
            "reportName", "capacityId", "capacityName", "workspaceId", "objectId", "datasetId", 
            "reportId", "artifactId", "artifactName", "artifactKind", "reportType", "requestId", 
            "activityId", "distributionMethod", operation, "organizationId", "consumptionMethod", 
            "userKey", workload
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
                    $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)`,
          [
            log.id, log.recordType, log.creationTime, log.userType, log.isSuccess, log.storedAt, log.userId,
            log.clientIP, log.userAgent, log.activity, log.itemName, log.workSpaceName, log.datasetName,
            log.reportName, log.capacityId, log.capacityName, log.workspaceId, log.objectId, log.datasetId,
            log.reportId, log.artifactId, log.artifactName, log.artifactKind, log.reportType, log.requestId,
            log.activityId, log.distributionMethod, log.operation, log.organizationId, log.consumptionMethod,
            log.userKey, log.workload
          ]
        );
      });
      
      await Promise.all(insertQueries);
      console.log(`Inserted batch ${i / BATCH_SIZE + 1} of ${Math.ceil(logs.length / BATCH_SIZE)}`);
    }

    console.log('Database seeding successfully completed!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await client.end();
  }
}

main();
