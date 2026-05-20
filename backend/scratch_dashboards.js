const axios = require('axios');
require('dotenv').config();

async function testGraphAPI() {
  const tenantId = process.env.TENANT_ID;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  try {
    // 1. Get token for MS Graph API
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('scope', 'https://graph.microsoft.com/.default');
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');

    const tokenRes = await axios.post(tokenUrl, params);
    const accessToken = tokenRes.data.access_token;
    console.log('Successfully got MS Graph access token.');

    // 2. Try to call the Graph API to list users
    const graphHeaders = {
      Authorization: `Bearer ${accessToken}`
    };
    
    console.log('Calling MS Graph /users API...');
    const usersRes = await axios.get('https://graph.microsoft.com/v1.0/users?$top=5', { headers: graphHeaders });
    
    console.log('Success! Users retrieved:', usersRes.data.value.length);
    if (usersRes.data.value.length > 0) {
      console.log('Sample user:', JSON.stringify(usersRes.data.value[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error.response ? JSON.stringify(error.response.data) : error.message);
  }
}

testGraphAPI();
