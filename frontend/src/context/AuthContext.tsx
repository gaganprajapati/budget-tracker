import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ isConfirmed: boolean }>;
  logout: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('budget_tracker_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    async function checkAuth(): Promise<void> {
      const storedToken = localStorage.getItem('budget_tracker_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/auth/me');
        if (response.data.success && response.data.data.user) {
          setUser(response.data.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to verify session token:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    queryClient.clear(); // Clear any previous user's query cache
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data.success) {
      const userObj = response.data.data.user;
      const accessToken = response.data.data.token;

      if (accessToken) {
        localStorage.setItem('budget_tracker_token', accessToken);
        setToken(accessToken);
      }
      if (userObj) {
        setUser(userObj);
      }
    }
  };

  const signup = async (email: string, password: string): Promise<{ isConfirmed: boolean }> => {
    queryClient.clear();
    const response = await apiClient.post('/auth/signup', { email, password });
    if (response.data.success) {
      const session = response.data.data.session;
      if (session && session.access_token) {
        localStorage.setItem('budget_tracker_token', session.access_token);
        setToken(session.access_token);
        setUser(response.data.data.user);
        return { isConfirmed: true };
      }
      return { isConfirmed: false };
    }
    return { isConfirmed: false };
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout API call failed:', err);
    } finally {
      queryClient.clear(); // Purge all cached reports, categories, plans, and locks from memory
      localStorage.removeItem('budget_tracker_token');
      setToken(null);
      setUser(null);
    }
  };




  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
