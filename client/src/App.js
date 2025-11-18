import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OwnerAuthProvider } from './contexts/OwnerAuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Contribute from './pages/Contribute';
import Voting from './pages/Voting';
import Whitepaper from './pages/Whitepaper';
import JoinNotice from './pages/JoinNotice';
import JoinDetails from './pages/JoinDetails';
import JoinContact from './pages/JoinContact';
import JoinLoss from './pages/JoinLoss';
import JoinThankYou from './pages/JoinThankYou';

import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';

import OwnerLogin from './pages/admin/OwnerLogin';
import OwnerControlPanel from './pages/admin/OwnerControlPanel';
import OwnerProtectedRoute from './components/OwnerProtectedRoute';

// Admin imports
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import './index.css';

// Protected Route Component (for regular users)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Public Route Component (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

// Layout Component
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navbar />
      <main className="pt-16">
        <div className="mobile-padding w-full">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};



function App() {
  return (
    <OwnerAuthProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/" 
                element={
                  <Layout>
                    <Home />
                  </Layout>
                } 
              />
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Layout>
                      <Login />
                    </Layout>
                  </PublicRoute>
                } 
              />
              <Route 
                path="/whitepaper" 
                element={
                  <Layout>
                    <Whitepaper />
                  </Layout>
                } 
              />
              <Route 
                path="/join-notice" 
                element={
                  <Layout>
                    <JoinNotice />
                  </Layout>
                } 
              />
              <Route 
                path="/join-details" 
                element={
                  <Layout>
                    <JoinDetails />
                  </Layout>
                } 
              />
              <Route 
                path="/join-contact" 
                element={
                  <Layout>
                    <JoinContact />
                  </Layout>
                } 
              />
              <Route 
                path="/join-loss" 
                element={
                  <Layout>
                    <JoinLoss />
                  </Layout>
                } 
              />
              <Route 
                path="/join-thanks" 
                element={
                  <Layout>
                    <JoinThankYou />
                  </Layout>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <Layout>
                    <Register />
                  </Layout>
                } 
              />

              {/* Protected User Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              {/* Map legacy /vote route to the live Voting page to avoid static/demo mismatch */}
              <Route 
                path="/vote" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Voting />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/contribute" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Contribute />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/voting" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Voting />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/leaderboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Leaderboard />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                } 
              />



              {/* Owner Admin Routes */}
              <Route 
                path="/admin/login" 
                element={<OwnerLogin />} 
              />
              <Route 
                path="/admin/owner" 
                element={
                  <OwnerProtectedRoute>
                    <OwnerControlPanel />
                  </OwnerProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              } />

              {/* Catch all route - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(17, 24, 39, 0.9)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                },
                success: {
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AdminAuthProvider>
    </AuthProvider>
    </OwnerAuthProvider>
  );
}

export default App;