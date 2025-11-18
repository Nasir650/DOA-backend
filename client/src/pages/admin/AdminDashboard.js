import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { 
  LayoutDashboard,
  Wallet,
  Vote,
  Users,
  Trophy,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Activity,
  TrendingUp,
  DollarSign,
  UserCheck,
  Clock,
  Shield,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getDashboardStats, getActivityLog } from '../../utils/datastore';

// Import admin components
import WalletManagement from './components/WalletManagement';
import VotingManagement from './components/VotingManagement';
import UserVotingRights from './components/UserVotingRights';
import PointsRanking from './components/PointsRanking';
import ContributionReceipts from './components/ContributionReceipts';
import UserProfileManagement from './components/UserProfileManagement';
import ContributionTimer from './components/ContributionTimer';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeVotes: 0,
    totalPoints: 0,
    totalVotesSubmitted: 0,
    pendingContributions: 0
  });

  const { admin, logout, hasPermission } = useAdminAuth();

  useEffect(() => {
    // Load dashboard statistics
    loadDashboardStats();
    loadNotifications();

    // Auto-refresh on datastore updates
    const onUpdate = () => {
      loadDashboardStats();
      loadNotifications();
    };
    window.addEventListener('datastore:update', onUpdate);
    return () => window.removeEventListener('datastore:update', onUpdate);
  }, []);

  const loadDashboardStats = async () => {
    try {
      const stats = getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const loadNotifications = () => {
    const activity = getActivityLog();
    const recent = activity.slice(0, 5).map((a) => ({
      id: a.id,
      message: a.message,
      type: a.type.includes('user') ? 'info' : a.type.includes('vote') ? 'success' : a.type.includes('contribution') ? 'warning' : 'info',
      time: new Date(a.time).toLocaleTimeString(),
    }));
    setNotifications(recent);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      permission: null
    },
    {
      id: 'wallet',
      label: 'Wallet & QR Codes',
      icon: Wallet,
      permission: 'wallet_management'
    },
    {
      id: 'voting',
      label: 'Voting Management',
      icon: Vote,
      permission: 'voting_management'
    },
    {
      id: 'voting-rights',
      label: 'User Voting Rights',
      icon: UserCheck,
      permission: 'user_management'
    },
    {
      id: 'contribution-timer',
      label: 'Contribution Timer',
      icon: Clock,
      permission: 'contribution_management'
    },
    {
      id: 'users',
      label: 'User Profiles',
      icon: Users,
      permission: 'user_management'
    },
    {
      id: 'points',
      label: 'Points & Ranking',
      icon: Trophy,
      permission: 'points_management'
    },
    {
      id: 'contributions',
      label: 'Contribution Receipts',
      icon: Receipt,
      permission: 'contribution_management'
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const renderDashboardOverview = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {admin?.username}!</h1>
        <p className="text-purple-100">Here's what's happening with your DOA platform today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">+12%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Votes</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.activeVotes}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Vote className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <Activity className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-blue-500 font-medium">2 ending soon</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Votes Submitted</p>
              <p className="text-2xl font-bold text-gray-900">{(dashboardStats.totalVotesSubmitted || 0).toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">Live totals</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Points</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalPoints.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">+8.5%</span>
            <span className="text-gray-500 ml-1">this week</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Contributions</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.pendingContributions}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Receipt className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <Clock className="w-4 h-4 text-orange-500 mr-1" />
            <span className="text-orange-500 font-medium">Needs review</span>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[ 
              { action: 'New user registered', user: 'john_doe', time: '2 minutes ago', type: 'user' },
              { action: 'Vote submitted', user: 'alice_smith', time: '5 minutes ago', type: 'vote' },
              { action: 'Contribution uploaded', user: 'bob_wilson', time: '10 minutes ago', type: 'contribution' },
              { action: 'Points awarded', user: 'carol_brown', time: '15 minutes ago', type: 'points' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${
                  activity.type === 'user' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'vote' ? 'bg-green-100 text-green-600' :
                  activity.type === 'contribution' ? 'bg-purple-100 text-purple-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {activity.type === 'user' && <UserCheck className="w-4 h-4" />}
                  {activity.type === 'vote' && <Vote className="w-4 h-4" />}
                  {activity.type === 'contribution' && <Receipt className="w-4 h-4" />}
                  {activity.type === 'points' && <Trophy className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">by {activity.user} • {activity.time}</p>
                </div>
              </div>
            ))}
            {/* Datastore-based activity */}
            {getActivityLog().slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${
                  activity.type === 'user_registered' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'vote_cast' ? 'bg-green-100 text-green-600' :
                  activity.type === 'contribution_uploaded' ? 'bg-purple-100 text-purple-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {activity.type === 'user_registered' && <UserCheck className="w-4 h-4" />}
                  {activity.type === 'vote_cast' && <Vote className="w-4 h-4" />}
                  {activity.type === 'contribution_uploaded' && <Receipt className="w-4 h-4" />}
                  {activity.type === 'receipt_verified' && <Trophy className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.userEmail} • {new Date(activity.time).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            {[
              { service: 'Database', status: 'online', uptime: '99.9%' },
              { service: 'API Server', status: 'online', uptime: '99.8%' },
              { service: 'File Storage', status: 'online', uptime: '100%' },
              { service: 'Email Service', status: 'warning', uptime: '98.5%' }
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    service.status === 'online' ? 'bg-green-500' :
                    service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900">{service.service}</span>
                </div>
                <span className="text-sm text-gray-500">{service.uptime}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardOverview();
      case 'wallet':
        return <WalletManagement />;
      case 'voting':
        return <VotingManagement />;
      case 'voting-rights':
        return <UserVotingRights />;
    case 'contribution-timer':
      return <ContributionTimer />;
      case 'users':
        return <UserProfileManagement />;
      case 'points':
        return <PointsRanking />;
      case 'contributions':
        return <ContributionReceipts />;
      default:
        return renderDashboardOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed lg:relative z-30 w-64 h-full bg-white shadow-xl border-r border-gray-200"
          >
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">DOA Admin</h2>
                    <p className="text-xs text-gray-500">Control Panel</p>
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="flex-1 p-4 space-y-2">
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </motion.button>
                  );
                })}
              </nav>

              {/* Admin Info & Logout */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-medium text-sm">
                      {admin?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{admin?.username}</p>
                    <p className="text-xs text-gray-500">{admin?.role}</p>
                  </div>
                </div>
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {activeSection === 'dashboard' ? 'Dashboard Overview' : activeSection.replace(/([A-Z])/g, ' $1')}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;