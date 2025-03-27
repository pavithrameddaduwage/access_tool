import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ADUser } from './interfaces/ad-user.interface';


const ActiveDirectory = require('activedirectory2').promiseWrapper;

const config = {
    url: 'ldap://HGUNBXDC01VM.Horizongroupusa.com',
    baseDN: 'dc=Horizongroupusa,dc=com',
    username: 'MISSVCACC',
    password: 'Horizon@MIS',
    // attributes: { user: [
    //     'company',
    //      'co',
    //      'sAMAccountName', 
    //      'mail',
    //      'displayName',
    //      'physicalDeliveryOfficeName',
    //     'comment', 
    //     'description',
    //     'department',
    //     'givenName',
    //     'thumbnailPhoto'
    //   ], },
    attributes:{
      user:[]
    },
      tlsOptions: {
        rejectUnauthorized: false,
     
       
    },
    timeout: 30000,  // Increase timeout
    reconnect: true, // Enable reconnection
    connectTimeout: 30000,
};
const ad = new ActiveDirectory(config);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}


  async authenticateuser(username: string, password: string): Promise<boolean> {
    try {
      console.log('Attempting AD authentication for:', username);
      return new Promise<boolean>((resolve) => {
        ad.authenticate(username, password, (err: any, auth: boolean) => {
          if (err) {
            console.log('AD authentication error:', err.message);
            resolve(false);
          } else {
            console.log('AD authentication result:', auth);
            resolve(auth);
          }
        });
      });
    } catch (error) {
      console.error('AD authentication unexpected error:', error);
      return false;
    }
  }

async getADUserDetails(username: string): Promise<ADUser> {
  let user = await new Promise<ADUser>((resolve, reject) => {
      ad.findUser(username, function(err: any, user: ADUser) {
          if (err) {
              reject(err);
          }
          if (user) {
              resolve(user);
          } else {
              resolve(null);
          }
      });
  });
  return user;
}


// SignIn with Local password

  // async signIn(username: string, pass: string): Promise<any> {
  //   const user = await this.usersService.findUserByEmail(username);
  //   console.log(user,user.user_roles.map((role:any)=>role.role.role));
  //   if (user?.password !== pass) {
  //     throw new UnauthorizedException();
  //   }
  //   const { password, ...result } = user;
  //   // TODO: Generate a JWT and return it here
  //   // instead of the user object
  //   const payload = { email: user.email, name: user.name ,userid:user.id,roles:user.user_roles.map((role:any)=>role.role.role)};
  //   return {
  //     access_token: await this.jwtService.signAsync(payload),
  //   };

  // }

  // SignIn with AD

  // async signIn(username: string, pass: string): Promise<any> {
  //   username = username.indexOf('@') > 0 ? username.slice(0, username.indexOf('@')) : username;
    
  //   let adauthentication = await this.authenticateuser(username + '@hgusa.com', pass);
  //   if (!adauthentication) {
  //     adauthentication = await this.authenticateuser(username + '@horizongroupusa.com', pass);
  //   }
    
  //   if (!adauthentication) {
  //     throw new UnauthorizedException('Authentication failed');
  //   }
  
  //   const aduser = await this.getADUserDetails(username);
  //   const dbUser = await this.usersService.findUserByEmail(aduser.mail.toString().toLowerCase());
    
  //   if (!dbUser) {
  //     throw new UnauthorizedException('User not found in database');
  //   }
  
  //   console.log('DB User:', dbUser);
  //   console.log('User roles:', dbUser.user_roles);
  //   console.log('Mapped roles:', dbUser.user_roles.map(role => role.role.role));
  //   console.log('Role details:', dbUser.user_roles.map(ur => ({
  //     roleId: ur.role.id,
  //     roleName: ur.role.role
  //   })));
  //   console.log('User roles before creating token:', dbUser.user_roles.map(role => role.role.role));

  //   const payload = {
  //     email: aduser.mail,
  //     name: dbUser.name,
  //     userid: dbUser.id,
  //     roles: dbUser.user_roles.map(role => role.role.role),
  //     department: aduser.department,
  //     location: aduser.location
  //   };

  //   console.log('JWT payload:', payload);

  
  //   return {
  //     access_token: await this.jwtService.signAsync(payload)
  //   };
  // }


//   async signIn(username: string, pass: string): Promise<any> {
//     username = username.toLowerCase().split('@')[0];
    
//     let adauthentication = await this.authenticateuser(`${username}@hgusa.com`, pass);
//     if (!adauthentication) {
//         adauthentication = await this.authenticateuser(`${username}@horizongroupusa.com`, pass);
//     }
    
//     if (!adauthentication) {
//         throw new UnauthorizedException('Authentication failed');
//     }

//     const aduser = await this.getADUserDetails(username);
//     if (!aduser || !aduser.mail) {
//         throw new UnauthorizedException('User not found in Active Directory');
//     }

//     const dbUser = await this.usersService.findUserByEmail(aduser.mail.toLowerCase());
//     if (!dbUser) {
//         throw new UnauthorizedException('User not found in database');
//     }

//     const payload = {
//         email: aduser.mail.toLowerCase(),
//         name: dbUser.name,
//         userid: dbUser.id,
//         roles: dbUser.user_roles.map(role => role.role.role),
//         department: aduser.department,
//         location: aduser.location
//     };

//     return {
//         access_token: await this.jwtService.signAsync(payload)
//     };
// }
// async signIn(username: string, pass: string): Promise<any> {
//   username = username.toLowerCase().split('@')[0];
  
//   let adauthentication = await this.authenticateuser(`${username}@hgusa.com`, pass);
//   if (!adauthentication) {
//       console.log('First domain auth failed, trying second domain...');
//       adauthentication = await this.authenticateuser(`${username}@horizongroupusa.com`, pass);
//   }
  
//   if (!adauthentication) {
//       console.log('AD Authentication failed for user:', username);
//       throw new UnauthorizedException('Active Directory authentication failed - Please check your credentials');
//   }

//   console.log('AD Authentication successful, getting AD user details...');
//   const aduser = await this.getADUserDetails(username);
//   if (!aduser || !aduser.mail) {
//       console.log('AD user details not found for:', username);
//       throw new UnauthorizedException('User details not found in Active Directory');
//   }

//   console.log('AD user found, checking local database...');
//   let dbUser = await this.usersService.findUserByEmail(aduser.mail.toLowerCase());
  
//   if (!dbUser) {
//       console.log('User not found in database, creating new user...');
//       const createUserDto = {
//           email: aduser.mail.toLowerCase(),
//           name: aduser.displayName || aduser.mail,
//           is_active: true,
//           user_roles: [{ roleId: 2 }]  
//       };

//       try {
//           dbUser = await this.usersService.create(createUserDto);
//           console.log('New user created successfully');
//       } catch (error) {
//           console.error('Failed to create user:', error);
//           throw new UnauthorizedException('Failed to create user account');
//       }
//   }

//   console.log('Creating JWT token...');
//   const payload = {
//       email: aduser.mail.toLowerCase(),
//       name: dbUser.name,
//       userid: dbUser.id,
//       roles: dbUser.user_roles.map(role => role.role.role),
//       department: aduser.department,
//       location: aduser.location
//   };

//   return {
//       access_token: await this.jwtService.signAsync(payload)
//   };
// }
async signIn(username: string, pass: string): Promise<any> {
  username = username.toLowerCase().split('@')[0];

  // First authenticate with AD
  let adauthentication = await this.authenticateuser(`${username}@hgusa.com`, pass);
  if (!adauthentication) {
    console.log('First domain auth failed, trying second domain...');
    adauthentication = await this.authenticateuser(`${username}@horizongroupusa.com`, pass);
  }

  if (!adauthentication) {
    console.log('AD Authentication failed for user:', username);
    throw new UnauthorizedException('Active Directory authentication failed - Please check your credentials');
  }

  console.log('AD Authentication successful, getting AD user details...');
  const aduser = await this.getADUserDetails(username);
  if (!aduser || !aduser.mail) {
    console.log('AD user details not found for:', username);
    throw new UnauthorizedException('User details not found in Active Directory');
  }

  // Convert email to lowercase for consistency
  const email = aduser.mail.toLowerCase();

  console.log('AD user found, checking local database...');
  const dbUser = await this.usersService.findUserByEmail(email);

  // Only allow login if user exists in database
  if (!dbUser) {
    console.log('User not found in database - access denied');
    throw new UnauthorizedException('You are not authorized to access this application. Please contact your administrator.');
  }

  // Check if user is active
  if (!dbUser.is_active) {
    console.log('User is inactive - access denied');
    throw new UnauthorizedException('Your account has been deactivated. Please contact your administrator.');
  }

  console.log('Creating JWT token...');
  const payload = {
    email: email,
    name: dbUser.name,
    userid: dbUser.id,
    roles: dbUser.user_roles.map(role => role.role.role),
    department: aduser.department,
    location: aduser.location
  };

  return {
    access_token: await this.jwtService.signAsync(payload)
  };
}

  async searchUsers(query: string): Promise<any[]> {
    console.log('Starting AD search with query:', query);
    const searchQuery = `(&(objectClass=user)(|(cn=${query}*)(mail=${query}*)))`;
    let searchCompleted = false;
  
    return new Promise((resolve, reject) => {
      let isResolved = false;
      console.log('Initiating AD findUsers call for:', query);
      
      try {
        ad.findUsers(searchQuery, true, (err, users) => {
          console.log('AD findUsers callback received for:', query);
          
          if (isResolved || searchCompleted) {
            console.log('Request was already resolved for:', query);
            return;
          }
          
          if (err) {
            console.error('AD Search Error for:', query, err);
            isResolved = true;
            return resolve([]);
          }
          
          if (!users) {
            console.log('No users found for:', query);
            isResolved = true;
            return resolve([]);
          }
  
          console.log("These are the users", users);
          const formattedUsers = users.map((f: any) => ({
            name: f.cn,
            email: f.mail,
            department: f.department
          }));
  
          console.log('Formatted users for:', query, formattedUsers);
          isResolved = true;
          searchCompleted = true;
          resolve(formattedUsers);
        });
      } catch (error) {
        console.error('Error in AD search for:', query, error);
        if (!isResolved) {
          isResolved = true;
          resolve([]);
        }
      }
      
      setTimeout(() => {
        if (!isResolved) {
          console.log('AD search timed out for:', query);
          isResolved = true;
          searchCompleted = true;
          resolve([]);
        }
      }, 15000);
    });
  }
}