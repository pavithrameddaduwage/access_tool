"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const ActiveDirectory = require('activedirectory2').promiseWrapper;
const config = {
    url: 'ldap://HGUNBXDC01VM.Horizongroupusa.com',
    baseDN: 'dc=Horizongroupusa,dc=com',
    username: 'MISSVCACC',
    password: 'Horizon@MIS',
    attributes: {
        user: []
    },
    tlsOptions: {
        rejectUnauthorized: false,
    },
    timeout: 30000,
    reconnect: true,
    connectTimeout: 30000,
};
const ad = new ActiveDirectory(config);
let AuthService = class AuthService {
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async authenticateuser(username, password) {
        try {
            console.log('Attempting AD authentication for:', username);
            return new Promise((resolve) => {
                ad.authenticate(username, password, (err, auth) => {
                    if (err) {
                        console.log('AD authentication error:', err.message);
                        resolve(false);
                    }
                    else {
                        console.log('AD authentication result:', auth);
                        resolve(auth);
                    }
                });
            });
        }
        catch (error) {
            console.error('AD authentication unexpected error:', error);
            return false;
        }
    }
    async getADUserDetails(username) {
        let user = await new Promise((resolve, reject) => {
            ad.findUser(username, function (err, user) {
                if (err) {
                    reject(err);
                }
                if (user) {
                    resolve(user);
                }
                else {
                    resolve(null);
                }
            });
        });
        return user;
    }
    async signIn(username, pass) {
        username = username.toLowerCase().split('@')[0];
        let adauthentication = await this.authenticateuser(`${username}@hgusa.com`, pass);
        if (!adauthentication) {
            console.log('First domain auth failed, trying second domain...');
            adauthentication = await this.authenticateuser(`${username}@horizongroupusa.com`, pass);
        }
        if (!adauthentication) {
            console.log('AD Authentication failed for user:', username);
            throw new common_1.UnauthorizedException('Active Directory authentication failed - Please check your credentials');
        }
        console.log('AD Authentication successful, getting AD user details...');
        const aduser = await this.getADUserDetails(username);
        if (!aduser || !aduser.mail) {
            console.log('AD user details not found for:', username);
            throw new common_1.UnauthorizedException('User details not found in Active Directory');
        }
        console.log('AD user found, checking local database...');
        let dbUser = await this.usersService.findUserByEmail(aduser.mail.toLowerCase());
        if (!dbUser) {
            console.log('User not found in database, creating new user...');
            const createUserDto = {
                email: aduser.mail.toLowerCase(),
                name: aduser.displayName || aduser.mail,
                is_active: true,
                user_roles: [{ roleId: 2 }]
            };
            try {
                dbUser = await this.usersService.create(createUserDto);
                console.log('New user created successfully');
            }
            catch (error) {
                console.error('Failed to create user:', error);
                throw new common_1.UnauthorizedException('Failed to create user account');
            }
        }
        console.log('Creating JWT token...');
        const payload = {
            email: aduser.mail.toLowerCase(),
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
    async searchUsers(query) {
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
                    const formattedUsers = users.map((f) => ({
                        name: f.cn,
                        email: f.mail,
                        department: f.department
                    }));
                    console.log('Formatted users for:', query, formattedUsers);
                    isResolved = true;
                    searchCompleted = true;
                    resolve(formattedUsers);
                });
            }
            catch (error) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map