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
  logout: () => Promise<void>;
  manualSync: () => Promise<boolean>;
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
          // Dispatch login event to notify other components
          window.dispatchEvent(new CustomEvent('simple-auth-login', { 
            detail: data.user 
          }));
          console.log('✅ Auth check found user - event dispatched');
        }
      } else if (response.status === 401) {
        // If SimpleAuth fails, try to sync from NextAuth
        console.log('⚠️ SimpleAuth returned 401, attempting NextAuth sync...');
        try {
          const syncResponse = await fetch('/api/auth/sync-session', {
            method: 'POST',
            credentials: 'include', // Important: include cookies
          });
          
          if (syncResponse.ok) {
            const syncData = await syncResponse.json();
        if (syncData.success) {
          setUser(syncData.user);
          localStorage.setItem('liff_simple_user', JSON.stringify(syncData.user));
          // Dispatch login event to notify other components
          window.dispatchEvent(new CustomEvent('simple-auth-login', { 
            detail: syncData.user 
          }));
          console.log('✅ Synced NextAuth session to SimpleAuth');
            }
          } else {
            console.log('❌ Sync failed:', syncResponse.status);
            const syncError = await syncResponse.json();
            console.log('🔍 Sync error details:', syncError);
            
            // Debug: Check session status
            try {
              const debugResponse = await fetch('/api/auth/debug-session', {
                credentials: 'include'
              });
              const debugData = await debugResponse.json();
              console.log('🔍 Debug session data:', debugData);
            } catch (debugError) {
              console.error('Debug session failed:', debugError);
            }
          }
        } catch (syncError) {
          console.error('Session sync failed:', syncError);
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

  const logout = async () => {
    try {
      // Clear SimpleAuth session on server
      const response = await fetch("/api/auth/logout-simple", {
        method: "POST",
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log('✅ SimpleAuth session cleared from server');
      } else {
        console.warn('⚠️ Failed to clear SimpleAuth session from server');
      }
    } catch (error) {
      console.error('❌ Error clearing SimpleAuth session:', error);
    }
    
    // Always clear local state regardless of server response
    setUser(null);
    localStorage.removeItem('liff_simple_user');
    localStorage.removeItem('liff_simple_login_time');
    console.log('✅ Local SimpleAuth state cleared');

    // Dispatch logout event to notify other components
    window.dispatchEvent(new CustomEvent('simple-auth-logout'));
  };

  const manualSync = async (): Promise<boolean> => {
    try {
      console.log('🔄 Manual sync triggered');
      const syncResponse = await fetch('/api/auth/sync-session', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        if (syncData.success) {
          setUser(syncData.user);
          localStorage.setItem('liff_simple_user', JSON.stringify(syncData.user));
          // Dispatch login event to notify other components
          window.dispatchEvent(new CustomEvent('simple-auth-login', { 
            detail: syncData.user 
          }));
          console.log('✅ Manual sync successful');
          return true;
        }
      } else {
        const error = await syncResponse.json();
        console.log('❌ Manual sync failed:', error);
      }
    } catch (error) {
      console.error('Manual sync error:', error);
    }
    return false;
  };

  useEffect(() => {
    console.log('🔄 useSimpleAuth mounted - initializing...');
    
    // Try to restore from localStorage first for quick display
    try {
      const storedUser = localStorage.getItem('liff_simple_user');
      const loginTime = localStorage.getItem('liff_simple_login_time');
      
      if (storedUser && loginTime) {
        const timeDiff = Date.now() - parseInt(loginTime);
        // If login was within last 7 days, restore immediately
        if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log('✅ Restored user from localStorage:', userData.id);
        } else {
          console.log('⚠️ Stored user data expired, removing...');
          localStorage.removeItem('liff_simple_user');
          localStorage.removeItem('liff_simple_login_time');
        }
      } else {
        console.log('📭 No stored user data found');
      }
    } catch (error) {
      console.error('❌ Error restoring from localStorage:', error);
    }

    // Always check server auth status
    console.log('🔍 Checking server auth status...');
    checkAuth();

    // Listen for logout events from other tabs/components
    const handleLogoutEvent = () => {
      console.log('🔄 Logout event detected - clearing auth state');
      setUser(null);
      setIsLoading(false);
    };

    // Listen for login events from other components
    const handleLoginEvent = (e: CustomEvent) => {
      console.log('🔄 Login event detected - updating auth state');
      setUser(e.detail);
      setIsLoading(false);
    };

    // Listen for LIFF auto login events
    const handleAutoLoginEvent = () => {
      console.log('🔄 LIFF auto login detected - checking auth state');
      // Re-check auth status when auto login happens
      checkAuth();
    };

    // Listen for force sync events
    const handleForceSyncEvent = () => {
      console.log('🔄 Force sync event detected - re-checking auth');
      // Force re-check auth status
      checkAuth();
    };

    // Listen for storage changes (when localStorage is cleared)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'liff_simple_user' && e.newValue === null) {
        console.log('🔄 Storage cleared - updating auth state');
        setUser(null);
        setIsLoading(false);
      } else if (e.key === 'liff_simple_user' && e.newValue) {
        // If user data is added to storage, sync it
        try {
          const userData = JSON.parse(e.newValue);
          console.log('🔄 Storage updated - syncing auth state');
          setUser(userData);
          setIsLoading(false);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
        }
      }
    };

    // Listen for focus events (when app comes back to foreground)
    const handleFocus = () => {
      console.log('🔄 App focused - checking auth state');
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('simple-auth-logout', handleLogoutEvent);
    window.addEventListener('simple-auth-login', handleLoginEvent as EventListener);
    window.addEventListener('liff-auto-login-success', handleAutoLoginEvent);
    window.addEventListener('force-auth-sync', handleForceSyncEvent);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('simple-auth-logout', handleLogoutEvent);
      window.removeEventListener('simple-auth-login', handleLoginEvent as EventListener);
      window.removeEventListener('liff-auto-login-success', handleAutoLoginEvent);
      window.removeEventListener('force-auth-sync', handleForceSyncEvent);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        manualSync,
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
