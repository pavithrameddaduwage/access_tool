// frontend/src/app/interfaces/webtool.interfaces.ts
export interface Webtool {
  id: number;
  webtool: string;
  description?: string;
  roles?: Role[];
  isExpanded?: boolean;
  users?: WebtoolUserDisplay[];  // Changed from WebtoolUser[] to WebtoolUserDisplay[]
  totalUsers?: number;
}
export interface UserRole {
  id: number;
  name: string;
  privileges: string;
}

export interface Role {
  id: number;
  roles: string;
  privileges: string;
}
export interface WebtoolUser {
  userId: number;
  userName: string;
  email: string;
  department: string;
  roles: { [webtoolId: number]: UserRole[] };
  webtools?: string[];
  isActive?: boolean;          // Add this
  lastActiveAt?: Date;         // Add this
}

// export interface WebtoolUser {
//   userId: number;  // Keep this as required
//   userName: string;
//   email: string;
//   department: string;
//   roles: { [webtoolId: number]: UserRole[] };
//   webtools?: string[];
// }

export interface HeaderOption {
  id: number;
  value: string;
  label: string;
  privileges?: string;
}

// Then modify WebtoolRoleSelection to use HeaderOption
export interface WebtoolRoleSelection {
  webtoolId: number;
  webtoolName: string;
  selectedRoles: UserRole[];
  availableRoles?: HeaderOption[];  // Changed from Role[] to HeaderOption[]
}
export interface CreateUserWebtoolDto {
  email: string;
  userName: string;
  department: string;
  webtoolId: number;
  roleId: number;
  isActive?: boolean;  // Add this line
}

  export interface UserWebtool {
    id?: number;
    userId?: number;
    webtoolId: number;
    roleId: number;
    userName: string;
    email: string;
    department: string;

    webtools: [];
    roles?: [{
      id: number;
      name: string;
      privileges: string;
    }];
    isActive: boolean;          // Add this
    lastActiveAt?: Date;        // Add this
  }
  
  export interface WebtoolUserDisplay {
    userId: number;
    userName: string;
    email: string;
    department: string;

    roles: UserRole[];
    webtools?: string[];
    isActive: boolean;          // Add this
    lastActiveAt?: Date;        // Add this
  }
  export interface WebtoolWithUsers extends Webtool {
    users: WebtoolUserDisplay[];
    totalUsers: number;
  }