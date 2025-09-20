"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";

interface User {
  id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  role: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (idToken: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/liff-simple');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
          // Store in localStorage for quick access
          localStorage.setItem('liff_simple_user', JSON.stringify(data.user));
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (idToken: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/liff-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('liff_simple_user', JSON.stringify(data.user));
        localStorage.setItem('liff_simple_login_time', Date.now().toString());
        return true;
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('liff_simple_user');
    localStorage.removeItem('liff_simple_login_time');
    // Clear cookie by calling logout endpoint
    fetch('/api/auth/liff-simple/logout', { method: 'POST' }).catch(() => {});
  };

  useEffect(() => {
    // Try to restore from localStorage first for quick display
    try {
      const storedUser = localStorage.getItem('liff_simple_user');
      const loginTime = localStorage.getItem('liff_simple_login_time');
      
      if (storedUser && loginTime) {
        const timeDiff = Date.now() - parseInt(loginTime);
        // If login was within last 7 days, restore immediately
        if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (error) {
      // Ignore localStorage errors
    }

    // Always check server auth status
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useSimpleAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within AuthProvider');
  }
  return context;
};
