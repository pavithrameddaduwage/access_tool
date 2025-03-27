export interface UserMapping {
    id?: number; // Optional because it might not be included in all responses
    email: string;
    real_name: string;
    created_at?: string; // Optional
    updated_at?: string; // Optional
  }