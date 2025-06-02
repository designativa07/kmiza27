export interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  phone_number?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  favorite_team?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface UserStats {
  total: number;
  active: number;
  withFavoriteTeam: number;
  recentInteractions: number;
  admins: number;
}

export interface CreateAdminData {
  name: string;
  username?: string;
  email?: string;
  phone_number?: string;
  password: string;
} 