export interface User {
    id: number;
    email: string;
    name: string;
    is_active: boolean;
    user_roles?: UserRole[];
  }
  
  export interface UserRole {
    id: number;
    role: Role;
  }
  
  export interface Role {
    id: number;
    role: string;
  }