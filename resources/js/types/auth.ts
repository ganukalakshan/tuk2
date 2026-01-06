export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}