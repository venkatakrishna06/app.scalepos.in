export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  role: 'admin' | 'staff' | 'user';
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  restaurant_name: string;
  restaurant_address?: string;
  restaurant_phone?: string;
  restaurant_email?: string;
  restaurant_description?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
