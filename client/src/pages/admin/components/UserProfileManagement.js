import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getUsersList as dsGetUsersList, getUserMeta as dsGetUserMeta } from '../../../utils/datastore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User,
  Search,
  Filter,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Award,
  TrendingUp,
  Activity,
  DollarSign,
  Vote,
  Gift,
  Settings,
  Shield,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  MoreVertical,
  UserCheck,
  UserX
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserProfileManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    loadUsers();
    // Periodic refresh to reflect new signups automatically
    const interval = setInterval(loadUsers, 15000);
    const onUpdate = () => loadUsers();
    window.addEventListener('datastore:update', onUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('datastore:update', onUpdate);
    };
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      const res = await axios.get('/api/users', { params: { limit: 100 } });
      const apiUsers = res.data?.data?.users || [];
      if (apiUsers.length > 0) {
        const mapped = apiUsers.map((u) => ({
          id: u._id,
          username: (u.email || '').split('@')[0],
          email: u.email,
          fullName: u.fullName || `${u.firstName} ${u.lastName || ''}`.trim(),
          phone: '',
          dateOfBirth: new Date(u.createdAt).toISOString(),
          address: '',
          joinedAt: u.createdAt,
          lastActive: u.lastLogin || u.updatedAt || u.createdAt,
          status: u.isActive ? 'active' : 'suspended',
          role: u.role || 'user',
          isVerified: true,
          votingRights: {
            enabled: (u.votingRights || 0) > 0,
            maxVotes: u.votingRights || 0,
            votesUsed: 0,
            lastVoteAt: null
          },
          points: {
            total: u.points || 0,
            earned: u.points || 0,
            spent: 0,
            rank: u.rank || 0
          },
          contributions: {
            total: u.stats?.totalContributions || 0,
            totalValue: u.stats?.contributionAmount || 0,
            currency: 'USD',
            usdValue: u.stats?.contributionAmount || 0,
            lastContribution: null
          },
          activity: {
            loginCount: 0,
            votesParticipated: u.stats?.totalVotes || 0,
            contributionsMade: u.stats?.totalContributions || 0,
            referralsCount: 0
          },
          security: {
            twoFactorEnabled: false,
            lastPasswordChange: u.updatedAt || u.createdAt,
            suspiciousActivity: false,
            loginAttempts: 0
          },
          notes: ''
        }));
        setUsers(mapped);
      } else {
        // API returned no users; fallback to datastore
        const localUsers = dsGetUsersList();
        const mapped = localUsers.map((u) => {
          const meta = dsGetUserMeta(u.email);
          return {
            id: u.email,
            username: (u.email || '').split('@')[0],
            email: u.email,
            fullName: u.name || u.email,
            phone: '',
            dateOfBirth: new Date(u.createdAt || Date.now()).toISOString(),
            address: '',
            joinedAt: u.createdAt || Date.now(),
            lastActive: u.createdAt || Date.now(),
            status: 'active',
            role: u.role || 'user',
            isVerified: true,
            votingRights: {
              enabled: (meta.votesAllowed || 0) > 0,
              maxVotes: meta.votesAllowed || 0,
              votesUsed: meta.votesUsed || 0,
              lastVoteAt: null
            },
            points: {
              total: meta.points || 0,
              earned: meta.points || 0,
              spent: 0,
              rank: 0
            },
            contributions: {
              total: 0,
              totalValue: meta.points || 0,
              currency: 'USD',
              usdValue: meta.points || 0,
              lastContribution: null
            },
            activity: {
              loginCount: 0,
              votesParticipated: meta.votesUsed || 0,
              contributionsMade: 0,
              referralsCount: 0
            },
            security: {
              twoFactorEnabled: false,
              lastPasswordChange: new Date(u.createdAt || Date.now()).toISOString(),
              suspiciousActivity: false,
              loginAttempts: 0
            },
            notes: ''
          };
        });
        setUsers(mapped);
      }
    } catch (err) {
      // Fallback: load from datastore on error
      const localUsers = dsGetUsersList();
      const mapped = localUsers.map((u) => {
        const meta = dsGetUserMeta(u.email);
        return {
          id: u.email,
          username: (u.email || '').split('@')[0],
          email: u.email,
          fullName: u.name || u.email,
          phone: '',
          dateOfBirth: new Date(u.createdAt || Date.now()).toISOString(),
          address: '',
          joinedAt: u.createdAt || Date.now(),
          lastActive: u.createdAt || Date.now(),
          status: 'active',
          role: u.role || 'user',
          isVerified: true,
          votingRights: {
            enabled: (meta.votesAllowed || 0) > 0,
            maxVotes: meta.votesAllowed || 0,
            votesUsed: meta.votesUsed || 0,
            lastVoteAt: null
          },
          points: {
            total: meta.points || 0,
            earned: meta.points || 0,
            spent: 0,
            rank: 0
          },
          contributions: {
            total: 0,
            totalValue: meta.points || 0,
            currency: 'USD',
            usdValue: meta.points || 0,
            lastContribution: null
          },
          activity: {
            loginCount: 0,
            votesParticipated: meta.votesUsed || 0,
            contributionsMade: 0,
            referralsCount: 0
          },
          security: {
            twoFactorEnabled: false,
            lastPasswordChange: new Date(u.createdAt || Date.now()).toISOString(),
            suspiciousActivity: false,
            loginAttempts: 0
          },
          notes: ''
        };
      });
      setUsers(mapped);
      console.error('Failed to load users from API, using local fallback:', err);
      toast.error(err.response?.data?.message || 'API failed, showing local users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleStatusUpdate = (userId, newStatus) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: newStatus }
        : user
    ));
    
    toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
  };

  const handleVotingRightsUpdate = (userId, enabled, maxVotes = 1) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { 
            ...user, 
            votingRights: { 
              ...user.votingRights, 
              enabled, 
              maxVotes: enabled ? maxVotes : 0 
            } 
          }
        : user
    ));
    
    toast.success(`Voting rights ${enabled ? 'enabled' : 'disabled'} for user`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'moderator': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['ID', 'Username', 'Full Name', 'Email', 'Status', 'Role', 'Points', 'Contributions', 'Last Active'],
      ...filteredUsers.map(user => [
        user.id,
        user.username,
        user.fullName,
        user.email,
        user.status,
        user.role,
        user.points.total,
        user.contributions.total,
        new Date(user.lastActive).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Users exported successfully');
  };

  const renderUserDetails = () => {
    if (!selectedUser) return null;

    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Name:</span>
                    <span className="font-medium">{selectedUser.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Username:</span>
                    <span className="font-medium">@{selectedUser.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{selectedUser.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="font-medium">{new Date(selectedUser.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Account Information</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verified:</span>
                    <span className={`flex items-center gap-1 ${selectedUser.isVerified ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.isVerified ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {selectedUser.isVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Joined:</span>
                    <span className="font-medium">{new Date(selectedUser.joinedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Active:</span>
                    <span className="font-medium">{new Date(selectedUser.lastActive).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Address</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {selectedUser.address}
              </p>
            </div>

            {selectedUser.notes && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Admin Notes</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedUser.notes}
                </p>
              </div>
            )}
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">{selectedUser.activity.loginCount}</div>
                <div className="text-sm text-blue-600">Total Logins</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <Vote className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">{selectedUser.activity.votesParticipated}</div>
                <div className="text-sm text-green-600">Votes Participated</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <Gift className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-900">{selectedUser.activity.contributionsMade}</div>
                <div className="text-sm text-purple-600">Contributions</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <User className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-900">{selectedUser.activity.referralsCount}</div>
                <div className="text-sm text-orange-600">Referrals</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Points Summary</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Points:</span>
                    <span className="font-bold text-green-600">{selectedUser.points.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points Earned:</span>
                    <span className="font-medium">{selectedUser.points.earned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points Spent:</span>
                    <span className="font-medium">{selectedUser.points.spent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Rank:</span>
                    <span className="font-bold text-purple-600">#{selectedUser.points.rank}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Contributions</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Contributions:</span>
                    <span className="font-medium">{selectedUser.contributions.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-medium">{selectedUser.contributions.totalValue} {selectedUser.contributions.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">USD Value:</span>
                    <span className="font-bold text-green-600">${selectedUser.contributions.usdValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Contribution:</span>
                    <span className="font-medium">{new Date(selectedUser.contributions.lastContribution).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'voting':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">Voting Rights Management</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-3">Current Status</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Voting Enabled:</span>
                      <span className={`flex items-center gap-1 ${selectedUser.votingRights.enabled ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedUser.votingRights.enabled ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {selectedUser.votingRights.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Votes:</span>
                      <span className="font-medium">{selectedUser.votingRights.maxVotes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Votes Used:</span>
                      <span className="font-medium">{selectedUser.votingRights.votesUsed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-bold text-blue-600">{selectedUser.votingRights.maxVotes - selectedUser.votingRights.votesUsed}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-700 mb-3">Quick Actions</h5>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVotingRightsUpdate(selectedUser.id, true, 1)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm"
                      >
                        Enable (1 vote)
                      </button>
                      <button
                        onClick={() => handleVotingRightsUpdate(selectedUser.id, true, 3)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                      >
                        Enable (3 votes)
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVotingRightsUpdate(selectedUser.id, true, 5)}
                        className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm"
                      >
                        Enable (5 votes)
                      </button>
                      <button
                        onClick={() => handleVotingRightsUpdate(selectedUser.id, false)}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
                      >
                        Disable
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Voting History</h4>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <Vote className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Voting history would be displayed here</p>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Security Status</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Two-Factor Auth:</span>
                    <span className={`flex items-center gap-1 ${selectedUser.security.twoFactorEnabled ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.security.twoFactorEnabled ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {selectedUser.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Suspicious Activity:</span>
                    <span className={`flex items-center gap-1 ${selectedUser.security.suspiciousActivity ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedUser.security.suspiciousActivity ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      {selectedUser.security.suspiciousActivity ? 'Detected' : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Failed Login Attempts:</span>
                    <span className={`font-medium ${selectedUser.security.loginAttempts > 3 ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedUser.security.loginAttempts}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Password Change:</span>
                    <span className="font-medium">{new Date(selectedUser.security.lastPasswordChange).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Security Actions</h4>
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm">
                    Force Password Reset
                  </button>
                  <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 text-sm">
                    Reset 2FA
                  </button>
                  <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm">
                    Lock Account
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Recent Security Events</h4>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Security event log would be displayed here</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Profile Management</h2>
          <p className="text-gray-600 mt-1">Manage user profiles, voting rights, and account details</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={loadUsers}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
          <motion.button
            onClick={exportUsers}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by username, name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="vip">VIP</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voting Rights
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.fullName}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                          {user.role.toUpperCase()}
                        </span>
                        {user.isVerified && <CheckCircle className="w-3 h-3 text-green-500" />}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{user.points.total}</div>
                      <div className="text-xs text-gray-500">Rank #{user.points.rank}</div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className={`flex items-center gap-1 ${user.votingRights.enabled ? 'text-green-600' : 'text-red-600'}`}>
                        {user.votingRights.enabled ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        <span className="text-sm font-medium">
                          {user.votingRights.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      {user.votingRights.enabled && (
                        <div className="text-xs text-gray-500">
                          {user.votingRights.votesUsed}/{user.votingRights.maxVotes} used
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(user.lastActive).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(user.lastActive).toLocaleTimeString()}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                          setActiveTab('profile');
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                        title="View profile"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>

                      {user.status === 'active' ? (
                        <motion.button
                          onClick={() => handleStatusUpdate(user.id, 'suspended')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
                          title="Suspend user"
                        >
                          <Ban className="w-4 h-4" />
                        </motion.button>
                      ) : (
                        <motion.button
                          onClick={() => handleStatusUpdate(user.id, 'active')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200"
                          title="Activate user"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </motion.button>
                      )}

                      <motion.button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                          setActiveTab('voting');
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors duration-200"
                        title="Manage voting rights"
                      >
                        <Vote className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                    {selectedUser.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedUser.fullName}</h3>
                    <p className="text-gray-600">@{selectedUser.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <Eye className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-6">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'activity', label: 'Activity', icon: Activity },
                  { id: 'voting', label: 'Voting Rights', icon: Vote },
                  { id: 'security', label: 'Security', icon: Shield }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {renderUserDetails()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfileManagement;