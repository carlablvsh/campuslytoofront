import React, { createContext, useContext, useState, useEffect } from 'react';

// API Base URL config
export const API_BASE_URL = 'http://localhost:5000/api';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  updateUser: (newUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('campusly_token');
      const storedUser = localStorage.getItem('campusly_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Optionally verify token with backend
        try {
          const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (!res.ok) {
            // Token expired or invalid
            logout();
          } else {
            const data = await res.json();
            setUser(data.user);
            localStorage.setItem('campusly_user', JSON.stringify(data.user));
          }
        } catch (err) {
          console.error('Failed to verify token, using offline backup:', err);
          // Keep offline state as backup in case backend is temporarily down
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid login details.');
        return false;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('campusly_token', data.token);
      localStorage.setItem('campusly_user', JSON.stringify(data.user));
      return true;
    } catch (err) {
      console.error('Login request error:', err);
      setError('Cannot connect to authentication server.');
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create student account.');
        return false;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('campusly_token', data.token);
      localStorage.setItem('campusly_user', JSON.stringify(data.user));
      return true;
    } catch (err) {
      console.error('Registration request error:', err);
      setError('Cannot connect to authentication server.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('campusly_token');
    localStorage.removeItem('campusly_user');
  };

  const clearError = () => setError(null);

  const updateUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('campusly_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, clearError, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
