import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { setUserMeta, logActivity, getUsersMap, setUsersMap } from '../utils/datastore';

const AuthContext = createContext();

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Check if it's a placeholder token
      if (token.startsWith('placeholder-token-')) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setLoading(false);
          return;
        }
      }

      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  // Placeholder users for testing without database
  const loadPlaceholderUsers = () => {
    try {
      const raw = localStorage.getItem('placeholderUsers');
      const persisted = raw ? JSON.parse(raw) : {};
      // Seed defaults if not present
      return {
        'user@doa.com': {
          id: persisted['user@doa.com']?.id || '1',
          email: 'user@doa.com',
          password: persisted['user@doa.com']?.password || 'password123',
          firstName: persisted['user@doa.com']?.firstName || 'John',
          lastName: persisted['user@doa.com']?.lastName || 'Doe',
          name: `${persisted['user@doa.com']?.firstName || 'John'} ${persisted['user@doa.com']?.lastName || 'Doe'}`,
          role: persisted['user@doa.com']?.role || 'user',
          totalPoints: persisted['user@doa.com']?.totalPoints || 1256,
          referralCode: persisted['user@doa.com']?.referralCode || 'DOA-JD-2024',
          createdAt: persisted['user@doa.com']?.createdAt || new Date().toISOString(),
          solanaAddress: persisted['user@doa.com']?.solanaAddress || '',
          telegramUsername: persisted['user@doa.com']?.telegramUsername || '',
          phoneNumber: persisted['user@doa.com']?.phoneNumber || '',
          country: persisted['user@doa.com']?.country || '',
          address: persisted['user@doa.com']?.address || ''
        },
        'admin@doa.com': {
          id: persisted['admin@doa.com']?.id || '2',
          email: 'admin@doa.com',
          password: persisted['admin@doa.com']?.password || 'admin123',
          firstName: persisted['admin@doa.com']?.firstName || 'Admin',
          lastName: persisted['admin@doa.com']?.lastName || 'User',
          name: `${persisted['admin@doa.com']?.firstName || 'Admin'} ${persisted['admin@doa.com']?.lastName || 'User'}`,
          role: persisted['admin@doa.com']?.role || 'admin',
          totalPoints: persisted['admin@doa.com']?.totalPoints || 5000,
          referralCode: persisted['admin@doa.com']?.referralCode || 'DOA-AD-2024',
          createdAt: persisted['admin@doa.com']?.createdAt || new Date().toISOString(),
          solanaAddress: persisted['admin@doa.com']?.solanaAddress || '',
          telegramUsername: persisted['admin@doa.com']?.telegramUsername || '',
          phoneNumber: persisted['admin@doa.com']?.phoneNumber || '',
          country: persisted['admin@doa.com']?.country || '',
          address: persisted['admin@doa.com']?.address || ''
        },
        ...persisted
      };
    } catch {
      return {};
    }
  };

  const savePlaceholderUsers = (map) => {
    localStorage.setItem('placeholderUsers', JSON.stringify(map));
  };

  const login = async (email, password) => {
    try {
      // Check placeholder users first
      const placeholderUserMap = loadPlaceholderUsers();
      const placeholderUser = placeholderUserMap[email];
      if (placeholderUser && placeholderUser.password === password) {
        const { password: _, ...userWithoutPassword } = placeholderUser;
        const token = 'placeholder-token-' + Date.now();
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
        setUser(userWithoutPassword);
        
        toast.success('Login successful! (Using placeholder data)');
        return { success: true };
      }

      // If not a placeholder user, try the actual API
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      const { token, user } = response.data?.data || {};
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid credentials';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      
      const { token, user } = response.data?.data || {};
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      // Fallback to placeholder registration for DB-free development
      const placeholderUserMap = loadPlaceholderUsers();
      const { email } = userData;
      if (placeholderUserMap[email]) {
        toast.error('User with this email already exists (placeholder)');
        return { success: false, message: 'User already exists' };
      }

      const id = String(Date.now());
      const newUser = {
        id,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: `${userData.firstName} ${userData.lastName}`,
        role: 'user',
        totalPoints: 0,
        referralCode: `DOA-${userData.firstName?.slice(0,1) || 'U'}${userData.lastName?.slice(0,1) || 'S'}-${new Date().getFullYear()}`,
        createdAt: new Date().toISOString(),
        solanaAddress: '',
        telegramUsername: '',
        phoneNumber: '',
        country: '',
        address: ''
      };

      const updatedMap = { ...placeholderUserMap, [email]: newUser };
      savePlaceholderUsers(updatedMap);
      // Keep datastore users map in sync (for components that use datastore directly)
      try {
        const existingUsersMap = getUsersMap();
        setUsersMap({ ...existingUsersMap, [email]: newUser });
      } catch {}

      const token = 'placeholder-token-' + Date.now();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ ...newUser, password: undefined }));
      setUser({ ...newUser, password: undefined });
      // Seed default meta: voting rights 1, used 0, points 0
      try {
        setUserMeta(email, { votesAllowed: 1, votesUsed: 0, points: 0 });
      } catch {}
      // Log activity for admin recent activities
      try {
        logActivity('New user registered', 'user_registered', email);
      } catch {}
      toast.success('Registration successful! (Using placeholder data)');
      return { success: true };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};