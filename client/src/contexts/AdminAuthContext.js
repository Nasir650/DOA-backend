import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  // Admin credentials - in production, this should be in environment variables
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123',
    role: 'super_admin'
  };

  const MAX_LOGIN_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('adminToken');
      const adminData = localStorage.getItem('adminData');
      const attempts = localStorage.getItem('adminLoginAttempts');
      const blockTime = localStorage.getItem('adminBlockTime');

      if (attempts) {
        setLoginAttempts(parseInt(attempts));
      }

      if (blockTime) {
        const blockTimeMs = parseInt(blockTime);
        if (Date.now() < blockTimeMs) {
          setIsBlocked(true);
          setTimeout(() => {
            setIsBlocked(false);
            setLoginAttempts(0);
            localStorage.removeItem('adminBlockTime');
            localStorage.removeItem('adminLoginAttempts');
          }, blockTimeMs - Date.now());
        } else {
          localStorage.removeItem('adminBlockTime');
          localStorage.removeItem('adminLoginAttempts');
          setLoginAttempts(0);
        }
      }

      if (token && adminData) {
        const parsedAdmin = JSON.parse(adminData);
        setAdmin(parsedAdmin);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking admin auth status:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    if (isBlocked) {
      throw new Error('Too many failed attempts. Please try again later.');
    }

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        const adminData = {
          username: ADMIN_CREDENTIALS.username,
          role: ADMIN_CREDENTIALS.role,
          loginTime: new Date().toISOString(),
          permissions: [
            'wallet_management',
            'voting_management', 
            'user_management',
            'points_management',
            'contribution_management',
            'system_settings'
          ]
        };

        const token = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminData', JSON.stringify(adminData));
        localStorage.removeItem('adminLoginAttempts');
        localStorage.removeItem('adminBlockTime');

        setAdmin(adminData);
        setIsAuthenticated(true);
        setLoginAttempts(0);
        setIsBlocked(false);

        return { success: true, admin: adminData };
      } else {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem('adminLoginAttempts', newAttempts.toString());

        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const blockTime = Date.now() + BLOCK_DURATION;
          localStorage.setItem('adminBlockTime', blockTime.toString());
          setIsBlocked(true);
          
          setTimeout(() => {
            setIsBlocked(false);
            setLoginAttempts(0);
            localStorage.removeItem('adminBlockTime');
            localStorage.removeItem('adminLoginAttempts');
          }, BLOCK_DURATION);

          throw new Error(`Too many failed attempts. Account blocked for 15 minutes.`);
        }

        throw new Error(`Invalid credentials. ${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining.`);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdmin(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (permission) => {
    return admin?.permissions?.includes(permission) || false;
  };

  const value = {
    isAuthenticated,
    admin,
    loading,
    loginAttempts,
    isBlocked,
    login,
    logout,
    hasPermission,
    maxAttempts: MAX_LOGIN_ATTEMPTS
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};