import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount, or handle OAuth callback
  useEffect(() => {
    const handleAuthInit = async () => {
      // Check for OAuth callback token in URL
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      const error = params.get('error');
      
      if (error) {
        console.error('OAuth error:', error);
        const message = params.get('message');
        if (message) {
          console.error('OAuth error message:', message);
        }
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsLoading(false);
        return;
      }
      
      if (urlToken) {
        // Store token from OAuth callback
        setToken(urlToken);
        localStorage.setItem('auth_token', urlToken);
        
        // Fetch user data using the token
        try {
          const API_URL = import.meta.env.PROD 
            ? 'https://api.jobfetch.app/api'
            : 'http://localhost:3001/api';
          
          const response = await fetch(`${API_URL}/user/me`, {
            headers: {
              'Authorization': `Bearer ${urlToken}`,
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (err) {
          console.error('Failed to fetch user data:', err);
        }
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsLoading(false);
        return;
      }
      
      // Normal token check from localStorage
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      
      setIsLoading(false);
    };
    
    handleAuthInit();
  }, []);

  const login = async (email: string, password: string) => {
    const API_URL = import.meta.env.PROD 
      ? 'https://api.jobfetch.app/api'
      : 'http://localhost:3001/api';
    
    const response = await fetch(`${API_URL}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    
    setToken(data.token);
    setUser(data.user);
    
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const signup = async (email: string, password: string, name?: string) => {
    const API_URL = import.meta.env.PROD 
      ? 'https://api.jobfetch.app/api'
      : 'http://localhost:3001/api';
    
    const response = await fetch(`${API_URL}/user/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await response.json();
    
    setToken(data.token);
    setUser(data.user);
    
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, isLoading }}>
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
