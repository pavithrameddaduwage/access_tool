import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ADUser } from './interfaces/ad-user.interface';
import { LoginTrackingService } from 'src/analytics/login-tracking.service';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';

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
    timeout: 30000,  
    reconnect: true,
    connectTimeout: 30000,
};
const ad = new ActiveDirectory(config);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService,
    private loginTrackingService: LoginTrackingService,
    @Inject(REQUEST) private request: Request,   ) {}


  async authenticateuser(username: string, password: string): Promise<boolean> {
    try {
      console.log('Attempting AD authentication for:', username);
      return new Promise<boolean>((resolve) => {
        ad.authenticate(username, password, (err: any, auth: boolean) => {
          if (err) {
            console.log('AD authentication error:', err.message);
            resolve(false);
          } else {
            // console.log('AD authentication result:', auth);
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


async signIn(username: string, pass: string): Promise<any> {
  username = username.toLowerCase().split('@')[0];

  let email = '';
  let dbUser: any = null;
  let aduser: any = null;

  if (username === 'admin' && pass === 'admin') {
    console.log('Bypassing AD authentication for local admin account...');
    dbUser = await this.usersService.seedDummyAdmin();
    email = dbUser.email;
    aduser = {
      mail: dbUser.email,
      cn: dbUser.name,
      department: 'Management',
      location: 'Corporate'
    };
  } else {
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
    aduser = await this.getADUserDetails(username);
    if (!aduser || !aduser.mail) {
      console.log('AD user details not found for:', username);
      throw new UnauthorizedException('User details not found in Active Directory');
    }

    // Convert email to lowercase for consistency
    email = aduser.mail.toLowerCase();

    console.log('AD user found, checking local database...');
    dbUser = await this.usersService.findUserByEmail(email);

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
  }

  const loginEvent = await this.loginTrackingService.recordLogin(
    email,
    'User Access Tool', 
    this.request,
    aduser.department,
    aduser.location,
  );

  // console.log('Creating JWT token...');
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
    // console.log('Starting AD search with query:', query);
    const searchQuery = `(&(objectClass=user)(|(cn=${query}*)(mail=${query}*)))`;
    let searchCompleted = false;
    
    const getMockUsers = (q: string) => {
      const mockUsers = [
        { cn: 'Admin User', mail: 'admin@hgusa.com', department: 'Management' },
        { cn: 'John Doe', mail: 'john.doe@hgusa.com', department: 'Engineering' },
        { cn: 'Jane Smith', mail: 'jane.smith@hgusa.com', department: 'HR' },
        { cn: 'Pavithra Meddaduwage', mail: 'pavithra@hgusa.com', department: 'Product' },
        { cn: 'Walmart Power BI Admin', mail: 'powerbi.admin@hgusa.com', department: 'Analytics' }
      ];
      return mockUsers.filter(u => 
        u.cn.toLowerCase().includes(q.toLowerCase()) || 
        u.mail.toLowerCase().includes(q.toLowerCase())
      ).map(f => ({
        name: f.cn,
        email: f.mail,
        department: f.department
      }));
    };

    return new Promise((resolve, reject) => {
      let isResolved = false;
      // console.log('Initiating AD findUsers call for:', query);
      
      try {
        ad.findUsers(searchQuery, true, (err, users) => {
          // console.log('AD findUsers callback received for:', query);
          
          if (isResolved || searchCompleted) {
            // console.log('Request was already resolved for:', query);
            return;
          }
          
          if (err) {
            console.error('AD Search Error for:', query, err);
            isResolved = true;
            return resolve(getMockUsers(query));
          }
          
          if (!users || users.length === 0) {
            console.log('No AD users found, falling back to mock users...');
            isResolved = true;
            return resolve(getMockUsers(query));
          }
  
          // console.log("These are the users", users);
          const formattedUsers = users.map((f: any) => ({
            name: f.cn,
            email: f.mail,
            department: f.department
          }));
  
          // console.log('Formatted users for:', query, formattedUsers);
          isResolved = true;
          searchCompleted = true;
          resolve(formattedUsers);
        });
      } catch (error) {
        console.error('Error in AD search for:', query, error);
        if (!isResolved) {
          isResolved = true;
          resolve(getMockUsers(query));
        }
      }
      
      setTimeout(() => {
        if (!isResolved) {
          console.log('AD search timed out for:', query, 'falling back to mock users...');
          isResolved = true;
          searchCompleted = true;
          resolve(getMockUsers(query));
        }
      }, 10000);
    });
  }



  
}