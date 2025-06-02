import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { toast } from 'sonner';
import { authService, LoginCredentials, AuthResponse } from '@/lib/api/services/auth.service';
import { tokenService } from '@/lib/token.service';
import { api } from '@/lib/api/axios';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  staff_id?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if token exists and is valid on initial load
    const initAuth = async () => {
      try {
        if (tokenService.isTokenValid()) {
          // Token is valid, set user from token
          const token = tokenService.getToken();
          if (token) {
            const decoded = jwtDecode<any>(token);
            
            setUser({
              id: parseInt(decoded.sub),
              email: decoded.email,
              name: decoded.name,
              role: decoded.role,
              staff_id: decoded.staff_id
            });
            
            // Set axios default header
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
        } else {
          // Token is invalid, clear it
          tokenService.clearTokens();
        }
      } catch (error) {
        // Error decoding token or fetching user, clear tokens
        tokenService.clearTokens();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      
      // Set persistent session preference
      tokenService.setPersistentSession(rememberMe);
      
      // Call the login API
      const credentials: LoginCredentials = { email, password };
      const response: AuthResponse = await authService.login(credentials);
      
      // Store token in appropriate storage
      tokenService.setToken(response.token);
      
      // Store refresh token if provided
      if (response.refreshToken) {
        tokenService.setRefreshToken();
      }
      
      // Set user from response
      setUser(response.user_account);
      
      // Set axios default header
      api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
      
      toast.success('Login successful');
    } catch (error) {
      setError('Invalid credentials');
      toast.error('Invalid credentials');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Call logout API
      try {
        await authService.logout();
      } catch (error) {
        // Continue with logout even if API call fails
      }
      
      // Clear tokens
      tokenService.clearTokens();
      
      // Clear user
      setUser(null);
      
      // Clear axios default header
      delete api.defaults.headers.common['Authorization'];
      
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}