import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  staff_id?: number;
}

interface DecodedToken {
  exp: number;
  sub: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const REMEMBER_ME_KEY = 'remember_me';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has chosen to be remembered
  const isPersistentSession = (): boolean => {
    return localStorage.getItem(REMEMBER_ME_KEY) === "true";
  };

  // Set remember me preference
  const setPersistentSession = (remember: boolean): void => {
    if (remember) {
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  };

  // Get token from appropriate storage based on remember me preference
  const getToken = (): string | null => {
    return isPersistentSession()
      ? localStorage.getItem(TOKEN_KEY)
      : sessionStorage.getItem(TOKEN_KEY);
  };

  // Set token in appropriate storage based on remember me preference
  const setToken = (token: string): void => {
    if (isPersistentSession()) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  };

  // Remove token from both storages to ensure it's completely cleared
  const removeToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  };

  // Check if token is valid
  const isTokenValid = (token: string): boolean => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Check if token exists and is valid on initial load
    const token = getToken();
    if (token && isTokenValid(token)) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        
        // Set user from token
        setUser({
          id: parseInt(decoded.sub),
          email: decoded.email as string,
          name: decoded.name as string,
          role: decoded.role as string,
          staff_id: decoded.staff_id as number | undefined
        });
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        // Invalid token, remove it
        removeToken();
      }
    } else if (token) {
      // Token exists but is invalid, remove it
      removeToken();
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      
      // Set persistent session preference
      setPersistentSession(rememberMe);
      
      // In a real app, this would be an API call to the same endpoint as the main app
      // For this example, we'll simulate a successful login with a mock token
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check credentials (in a real app, this would be done by the server)
      if (email === 'admin@example.com' && password === 'Password123!') {
        // Create a mock token that expires in 1 hour
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsIm5hbWUiOiJBZG1pbiBVc2VyIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNjkzNTg3MjAwfQ.8zGRBBrlwFEGLTQUGYhUOQpnN6YWaRGBIoAJKqK6Asc';
        
        // Store token in appropriate storage
        setToken(mockToken);
        
        // Set user from token
        const decoded = jwtDecode<DecodedToken>(mockToken);
        setUser({
          id: parseInt(decoded.sub),
          email: decoded.email as string,
          name: decoded.name as string,
          role: decoded.role as string,
          staff_id: decoded.staff_id as number | undefined
        });
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
        
        toast.success('Login successful');
      } else {
        setError('Invalid credentials');
        toast.error('Invalid credentials');
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      setError('Login failed');
      toast.error('Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
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