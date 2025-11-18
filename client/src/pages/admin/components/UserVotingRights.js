import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Vote,
  Shield,
  ShieldOff,
  Edit3,
  Save,
  X,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getUsersList, getUserMeta, updateVotingRights, setUserMeta } from '../../../utils/datastore';

const UserVotingRights = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [bulkAction, setBulkAction] = useState({
    type: 'enable',
    votesAllowed: 1
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus]);

  const loadUsers = () => {
    const realUsers = getUsersList();
    const mapped = realUsers.map((u) => {
      const meta = getUserMeta(u.email);
      const username = u.email.split('@')[0];
      return {
        id: u.email, // use email as stable id
        username,
        email: u.email,
        fullName: u.name || username,
        votingEnabled: (meta.votesAllowed || 0) > 0,
        votesAllowed: meta.votesAllowed || 0,
        votesUsed: meta.votesUsed || 0,
        totalVotes: meta.votesUsed || 0,
        joinDate: new Date(u.createdAt || Date.now()).toISOString().slice(0, 10),
        lastVote: new Date(u.createdAt || Date.now()).toISOString().slice(0, 10),
        points: meta.points || 0,
        status: 'active',
        avatar: null,
      };
    });
    setUsers(mapped);
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      switch (filterStatus) {
        case 'enabled':
          filtered = filtered.filter(user => user.votingEnabled);
          break;
        case 'disabled':
          filtered = filtered.filter(user => !user.votingEnabled);
          break;
        case 'multiple':
          filtered = filtered.filter(user => user.votesAllowed > 1);
          break;
        case 'suspended':
          filtered = filtered.filter(user => user.status === 'suspended');
          break;
        default:
          break;
      }
    }

    setFilteredUsers(filtered);
  };

  const handleUpdateVotingRights = (userId, updates) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    let nextVotesAllowed = target.votesAllowed;
    if (updates.votingEnabled !== undefined) {
      nextVotesAllowed = updates.votingEnabled ? Math.max(target.votesAllowed, 1) : 0;
    }
    if (updates.votesAllowed !== undefined) {
      nextVotesAllowed = updates.votesAllowed;
    }
    updateVotingRights(target.email, nextVotesAllowed);
    // keep votesUsed unchanged locally
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, votingEnabled: nextVotesAllowed > 0, votesAllowed: nextVotesAllowed }
        : user
    ));
    if (updates.votingEnabled !== undefined) {
      toast.success(updates.votingEnabled ? 'Voting enabled for user' : 'Voting disabled for user');
    } else if (updates.votesAllowed !== undefined) {
      toast.success(`Voting rights updated to ${nextVotesAllowed} votes`);
    }
  };

  const handleBulkAction = () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }

    const updates = {};
    
    switch (bulkAction.type) {
      case 'enable':
        updates.votingEnabled = true;
        updates.votesAllowed = bulkAction.votesAllowed;
        break;
      case 'disable':
        updates.votingEnabled = false;
        updates.votesAllowed = 0;
        break;
      case 'setVotes':
        updates.votesAllowed = bulkAction.votesAllowed;
        break;
      default:
        break;
    }

    setUsers(users.map(user => {
      if (selectedUsers.includes(user.id)) {
        const nextVotesAllowed = updates.votesAllowed !== undefined ? updates.votesAllowed : (updates.votingEnabled ? Math.max(user.votesAllowed, 1) : 0);
        updateVotingRights(user.email, nextVotesAllowed);
        return { ...user, votingEnabled: nextVotesAllowed > 0, votesAllowed: nextVotesAllowed };
      }
      return user;
    }));

    setSelectedUsers([]);
    setShowBulkModal(false);
    toast.success(`Bulk action applied to ${selectedUsers.length} users`);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'vip': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVotingStatusIcon = (user) => {
    if (!user.votingEnabled) {
      return <UserX className="w-4 h-4 text-red-500" />;
    }
    if (user.votesAllowed > 1) {
      return <Shield className="w-4 h-4 text-purple-500" />;
    }
    return <UserCheck className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Voting Rights</h2>
          <p className="text-gray-600 mt-1">Manage user voting permissions and multiple vote allowances</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedUsers.length > 0 && (
            <motion.button
              onClick={() => setShowBulkModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Settings className="w-4 h-4" />
              Bulk Actions ({selectedUsers.length})
            </motion.button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users by username, email, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Users</option>
            <option value="enabled">Voting Enabled</option>
            <option value="disabled">Voting Disabled</option>
            <option value="multiple">Multiple Votes</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={selectAllUsers}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voting Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Votes Allowed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`hover:bg-gray-50 transition-colors duration-200 ${
                    selectedUsers.includes(user.id) ? 'bg-purple-50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  
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
                    <div className="flex items-center gap-2">
                      {getVotingStatusIcon(user)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={user.votesAllowed}
                          onChange={(e) => handleUpdateVotingRights(user.id, { 
                            votesAllowed: parseInt(e.target.value) || 0 
                          })}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => setEditingUser(null)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{user.votesAllowed}</span>
                        <button
                          onClick={() => setEditingUser(user.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Used:</span>
                        <span className="font-medium">{user.votesUsed}/{user.votesAllowed}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-purple-500 h-1 rounded-full transition-all duration-300"
                          style={{ 
                            width: user.votesAllowed > 0 
                              ? `${(user.votesUsed / user.votesAllowed) * 100}%` 
                              : '0%' 
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <div className="text-gray-600">
                        Total: <span className="font-medium text-gray-900">{user.totalVotes}</span>
                      </div>
                      <div className="text-gray-600">
                        Points: <span className="font-medium text-gray-900">{user.points}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Last: {new Date(user.lastVote).toLocaleDateString()}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => handleUpdateVotingRights(user.id, { 
                          votingEnabled: !user.votingEnabled,
                          votesAllowed: user.votingEnabled ? 0 : 1
                        })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          user.votingEnabled
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                        title={user.votingEnabled ? 'Disable voting' : 'Enable voting'}
                      >
                        {user.votingEnabled ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </motion.button>

                      <motion.button
                        onClick={() => handleUpdateVotingRights(user.id, { 
                          votesAllowed: Math.min(user.votesAllowed + 1, 10) 
                        })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                        title="Increase votes"
                        disabled={user.votesAllowed >= 10}
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        onClick={() => handleUpdateVotingRights(user.id, { 
                          votesAllowed: Math.max(user.votesAllowed - 1, 0) 
                        })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors duration-200"
                        title="Decrease votes"
                        disabled={user.votesAllowed <= 0}
                      >
                        <Minus className="w-4 h-4" />
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
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Bulk Actions Modal */}
      <AnimatePresence>
        {showBulkModal && (
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
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Bulk Actions</h3>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">
                  Apply action to {selectedUsers.length} selected user{selectedUsers.length > 1 ? 's' : ''}
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Type
                  </label>
                  <select
                    value={bulkAction.type}
                    onChange={(e) => setBulkAction({ ...bulkAction, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="enable">Enable Voting</option>
                    <option value="disable">Disable Voting</option>
                    <option value="setVotes">Set Vote Count</option>
                  </select>
                </div>

                {(bulkAction.type === 'enable' || bulkAction.type === 'setVotes') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Votes Allowed
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={bulkAction.votesAllowed}
                      onChange={(e) => setBulkAction({ 
                        ...bulkAction, 
                        votesAllowed: parseInt(e.target.value) || 1 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAction}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserVotingRights;