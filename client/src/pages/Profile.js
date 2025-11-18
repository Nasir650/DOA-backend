import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Calendar, 
  Award, 
  BarChart3, 
  Coins, 
  Trophy, 
  Edit3, 
  Save, 
  X,
  Shield,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  getUserMeta as dsGetUserMeta,
  getReceipts as dsGetReceipts,
  getActivityLog as dsGetActivityLog
} from '../utils/datastore';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPoints: 0,
    votingPoints: 0,
    contributionPoints: 0,
    totalVotes: 0,
    totalContributions: 0,
    successRate: 0,
    rank: 0
  });
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  useEffect(() => {
    // Initial load: fetch server stats and hydrate local stats
    fetchUserStats();
    loadLocalStats();

    // Auto-refresh on datastore updates (e.g., receipt verified, points changed)
    const onUpdate = () => {
      loadLocalStats();
      fetchUserStats();
    };
    window.addEventListener('datastore:update', onUpdate);
    return () => window.removeEventListener('datastore:update', onUpdate);
  }, [user?.email]);

  const fetchUserStats = async () => {
    try {
      const response = await axios.get('/api/users/stats/me');
      setStats((prev) => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Hydrate stats from local datastore for immediate UI updates
  const loadLocalStats = () => {
    try {
      if (!user?.email) return;
      const meta = dsGetUserMeta(user.email) || {};
      const receipts = dsGetReceipts() || [];
      const verifiedContribs = receipts.filter(r => r.userEmail === user.email && r.verified).length;
      const activity = dsGetActivityLog().filter(a => a.userEmail === user.email);
      setStats((prev) => ({
        ...prev,
        totalPoints: meta.points || 0,
        votingPoints: meta.pointsVoting || 0,
        contributionPoints: meta.pointsContribution || 0,
        totalVotes: meta.votesUsed || 0,
        totalContributions: verifiedContribs,
        // successRate and rank remain from API if provided; otherwise leave as-is
      }));
    } catch (e) {
      // Ignore local errors; UI will still show server stats
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await axios.put(`/api/users/${user._id}`, formData);
      updateUser(response.data.user);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'from-red-500 to-pink-500';
      case 'moderator':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-blue-500 to-purple-500';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return Shield;
      case 'moderator':
        return Award;
      default:
        return User;
    }
  };

  const statCards = [
    {
      title: 'Total Points',
      value: stats.totalPoints?.toLocaleString() || '0',
      icon: Trophy,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      title: 'Voting Points',
      value: stats.votingPoints?.toLocaleString() || '0',
      icon: BarChart3,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Contribution Points',
      value: stats.contributionPoints?.toLocaleString() || '0',
      icon: Coins,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate || 0}%`,
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const activityStats = [
    {
      label: 'Total Votes',
      value: stats.totalVotes || 0,
      icon: BarChart3
    },
    {
      label: 'Total Contributions',
      value: stats.totalContributions || 0,
      icon: Coins
    },
    {
      label: 'Current Rank',
      value: `#${stats.rank || 'N/A'}`,
      icon: Trophy
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center space-x-6 mb-6 md:mb-0">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r ${getRoleColor(user.role)} rounded-full flex items-center justify-center`}>
                  <RoleIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div>
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Full Name"
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Email"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
                    <div className="flex items-center space-x-4 text-gray-300">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getRoleColor(user.role)} text-white`}>
                        <RoleIcon className="w-4 h-4 mr-1" />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.title}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Activity Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
            <Clock className="w-6 h-6" />
            <span>Activity Overview</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activityStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;