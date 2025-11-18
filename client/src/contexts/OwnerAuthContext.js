import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const OwnerAuthContext = createContext();

export const useOwnerAuth = () => {
  const context = useContext(OwnerAuthContext);
  if (!context) {
    throw new Error('useOwnerAuth must be used within an OwnerAuthProvider');
  }
  return context;
};

export const OwnerAuthProvider = ({ children }) => {
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerData, setOwnerData] = useState(null);

  // Owner credentials (in production, this should be in environment variables)
  const OWNER_CREDENTIALS = {
    username: 'deo_owner',
    password: 'DEO_Admin_2024!@#',
    email: 'owner@deo.com'
  };

  useEffect(() => {
    // Check if owner is already authenticated
    const ownerToken = localStorage.getItem('deo_owner_token');
    const ownerSession = localStorage.getItem('deo_owner_session');
    
    if (ownerToken && ownerSession) {
      try {
        const sessionData = JSON.parse(ownerSession);
        const currentTime = new Date().getTime();
        
        // Check if session is still valid (24 hours)
        if (currentTime - sessionData.loginTime < 24 * 60 * 60 * 1000) {
          setIsOwnerAuthenticated(true);
          setOwnerData(sessionData.ownerData);
        } else {
          // Session expired
          localStorage.removeItem('deo_owner_token');
          localStorage.removeItem('deo_owner_session');
        }
      } catch (error) {
        console.error('Error parsing owner session:', error);
        localStorage.removeItem('deo_owner_token');
        localStorage.removeItem('deo_owner_session');
      }
    }
    
    setIsLoading(false);
  }, []);

  const ownerLogin = async (username, password) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (username === OWNER_CREDENTIALS.username && password === OWNER_CREDENTIALS.password) {
        const ownerToken = `deo_owner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const sessionData = {
          loginTime: new Date().getTime(),
          ownerData: {
            username: OWNER_CREDENTIALS.username,
            email: OWNER_CREDENTIALS.email,
            role: 'SUPER_ADMIN',
            permissions: ['ALL']
          }
        };
        
        localStorage.setItem('deo_owner_token', ownerToken);
        localStorage.setItem('deo_owner_session', JSON.stringify(sessionData));
        
        setIsOwnerAuthenticated(true);
        setOwnerData(sessionData.ownerData);
        
        toast.success('Owner login successful!');
        return { success: true };
      } else {
        toast.error('Invalid owner credentials!');
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const ownerLogout = () => {
    localStorage.removeItem('deo_owner_token');
    localStorage.removeItem('deo_owner_session');
    setIsOwnerAuthenticated(false);
    setOwnerData(null);
    toast.success('Owner logged out successfully');
  };

  const refreshOwnerSession = () => {
    const ownerSession = localStorage.getItem('deo_owner_session');
    if (ownerSession) {
      try {
        const sessionData = JSON.parse(ownerSession);
        sessionData.loginTime = new Date().getTime();
        localStorage.setItem('deo_owner_session', JSON.stringify(sessionData));
      } catch (error) {
        console.error('Error refreshing owner session:', error);
      }
    }
  };

  const value = {
    isOwnerAuthenticated,
    isLoading,
    ownerData,
    ownerLogin,
    ownerLogout,
    refreshOwnerSession
  };

  return (
    <OwnerAuthContext.Provider value={value}>
      {children}
    </OwnerAuthContext.Provider>
  );
};