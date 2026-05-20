const axios = require('axios');

async function main() {
  try {
    console.log('Logging in to get authentication token...');
    const loginRes = await axios.post('http://localhost:4006/auth/login', {
      email: 'admin',
      password: 'admin'
    });
    const token = loginRes.data.access_token;
    console.log('Successfully authenticated.');

    // We will sync logs for the last 7 days, in 24-hour increments
    const now = new Date();
    const headers = { Authorization: `Bearer ${token}` };

    for (let i = 7; i >= 0; i--) {
      const start = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

      const startIso = start.toISOString().replace(/\.\d{3}Z$/, 'Z');
      const endIso = end.toISOString().replace(/\.\d{3}Z$/, 'Z');

      console.log(`Syncing real Power BI logs from ${startIso} to ${endIso}...`);
      try {
        const syncUrl = `http://localhost:4006/powerbi-metrics/collect-raw?startDate=${startIso}&endDate=${endIso}`;
        const res = await axios.get(syncUrl, { headers });
        console.log(`Successfully completed sync for day -${i}.`);
      } catch (err) {
        console.error(`Failed to sync day -${i}: ${err.response ? JSON.stringify(err.response.data) : err.message}`);
      }
    }
    console.log('All real log sync requests completed!');
  } catch (err) {
    console.error('Fatal error running sync:', err.message);
  }
}

main();
