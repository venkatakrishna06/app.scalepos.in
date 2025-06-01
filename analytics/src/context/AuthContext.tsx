import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'analytics_auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and is valid on initial load
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp > currentTime) {
          // Token is valid, set user from token
          setUser({
            id: parseInt(decoded.sub),
            email: decoded.email as string,
            name: decoded.name as string,
            role: decoded.role as string,
          });
          
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          // Token expired, remove it
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch (error) {
        // Invalid token, remove it
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // In a real app, this would be an API call
      // For this example, we'll simulate a successful login with a mock token
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check credentials (in a real app, this would be done by the server)
      if (email === 'admin@example.com' && password === 'Password123!') {
        // Create a mock token that expires in 1 hour
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsIm5hbWUiOiJBZG1pbiBVc2VyIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNjkzNTg3MjAwfQ.8zGRBBrlwFEGLTQUGYhUOQpnN6YWaRGBIoAJKqK6Asc';
        
        localStorage.setItem(TOKEN_KEY, mockToken);
        
        // Set user from token
        const decoded = jwtDecode<DecodedToken>(mockToken);
        setUser({
          id: parseInt(decoded.sub),
          email: decoded.email as string,
          name: decoded.name as string,
          role: decoded.role as string,
        });
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
        
        toast.success('Login successful');
      } else {
        toast.error('Invalid credentials');
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      toast.error('Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
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