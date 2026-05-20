const ActiveDirectory = require('activedirectory2').promiseWrapper;

const config = {
  url: 'ldap://HGUNBXDC01VM.Horizongroupusa.com',
  baseDN: 'dc=Horizongroupusa,dc=com',
  username: 'MISSVCACC',
  password: 'Horizon@MIS',
  attributes: {
    user: ['cn', 'mail', 'department', 'displayName']
  },
  tlsOptions: {
    rejectUnauthorized: false
  },
  timeout: 5000,
  connectTimeout: 5000
};

const ad = new ActiveDirectory(config);

async function main() {
  console.log('Testing connection to AD server at ldap://HGUNBXDC01VM.Horizongroupusa.com...');
  try {
    const query = 'sbandara';
    const searchQuery = `(&(objectClass=user)(|(cn=${query}*)(mail=${query}*)))`;
    console.log('Searching for users matching query:', query);
    
    ad.findUsers(searchQuery, true, (err, users) => {
      if (err) {
        console.error('AD Search Error:', err);
      } else {
        console.log('AD Search success! Found users count:', users ? users.length : 0);
        if (users && users.length > 0) {
          console.log('Sample users:', users);
        }
      }
    });
  } catch (e) {
    console.error('Catch error:', e);
  }
}

main();
