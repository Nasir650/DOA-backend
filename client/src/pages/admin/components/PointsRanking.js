import React, { useState, useEffect } from 'react';
import { 
  getUsersList as dsGetUsersList,
  getReceipts as dsGetReceipts,
  getUserMeta as dsGetUserMeta,
  getActivityLog as dsGetActivityLog
} from '../../../utils/datastore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Star,
  Crown,
  Target,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const PointsRanking = () => {
  const [rankings, setRankings] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showDetails, setShowDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPoints: 0,
    averagePoints: 0,
    topPerformer: null
  });

  useEffect(() => {
    loadRankings();
    const onUpdate = () => loadRankings();
    window.addEventListener('datastore:update', onUpdate);
    return () => window.removeEventListener('datastore:update', onUpdate);
  }, [timeFilter, categoryFilter]);

  const loadRankings = async () => {
    setLoading(true);
    try {
      // Pull real data from datastore
      const users = dsGetUsersList();
      const receipts = dsGetReceipts();
      const activity = dsGetActivityLog();

      // Build leaderboard with real metrics
      const data = users.map((u) => {
        const meta = dsGetUserMeta(u.email) || {};
        const username = (u.email || '').split('@')[0];

        // Contributions: verified receipts by user
        const contribCount = receipts.filter(r => r.userEmail === u.email && r.verified).length;

        // Last activity: most recent activity event for user
        const userActivities = activity.filter(a => a.userEmail === u.email);
        const lastActivityTime = userActivities.length
          ? new Date(Math.max(...userActivities.map(a => new Date(a.time).getTime())))
          : (u.createdAt ? new Date(u.createdAt) : new Date());

        return {
          id: u.email,
          email: u.email,
          username,
          fullName: u.name || username,
          totalPoints: meta.points || 0,
          votingPoints: meta.pointsVoting || 0,
          contributionPoints: meta.pointsContribution || 0,
          bonusPoints: meta.pointsReferral || meta.pointsBonus || 0,
          totalVotes: meta.votesUsed || 0,
          totalContributions: contribCount,
          joinDate: u.createdAt || new Date().toISOString(),
          lastActivity: lastActivityTime.toISOString(),
          status: 'active',
          pointsChange: 0,
          badges: [],
          avatar: null,
        };
      });

      // Sort by total points desc and assign ranks
      const sorted = data
        .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
        .map((u, idx) => ({
          ...u,
          rank: idx + 1,
          previousRank: idx + 1,
        }));

      const totalUsers = sorted.length;
      const totalPoints = sorted.reduce((sum, u) => sum + (u.totalPoints || 0), 0);
      const averagePoints = totalUsers ? Math.round(totalPoints / totalUsers) : 0;
      const topPerformer = sorted[0] || null;

      setRankings(sorted);
      setStats({ totalUsers, totalPoints, averagePoints, topPerformer });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">{rank}</span>;
    }
  };

  const getRankChange = (current, previous) => {
    if (previous === current) return null;
    const change = previous - current;
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="w-3 h-3" />
          <span className="text-xs">+{change}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="w-3 h-3" />
          <span className="text-xs">{change}</span>
        </div>
      );
    }
  };

  const getPointsChange = (change) => {
    if (change === 0) return null;
    return (
      <span className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
        ({change > 0 ? '+' : ''}{change})
      </span>
    );
  };

  const getBadgeColor = (badge) => {
    const colors = {
      'Top Voter': 'bg-blue-100 text-blue-800',
      'Consistent Contributor': 'bg-green-100 text-green-800',
      'Early Adopter': 'bg-purple-100 text-purple-800',
      'Big Contributor': 'bg-orange-100 text-orange-800',
      'Reliable Voter': 'bg-indigo-100 text-indigo-800',
      'Active Voter': 'bg-cyan-100 text-cyan-800',
      'Growing Fast': 'bg-emerald-100 text-emerald-800',
      'Steady Contributor': 'bg-teal-100 text-teal-800',
      'Rising Star': 'bg-yellow-100 text-yellow-800',
      'Creative Mind': 'bg-pink-100 text-pink-800',
      'Tech Enthusiast': 'bg-violet-100 text-violet-800',
      'Detail Oriented': 'bg-slate-100 text-slate-800'
    };
    return colors[badge] || 'bg-gray-100 text-gray-800';
  };

  const exportRankings = () => {
    const csvContent = [
      ['Rank', 'Username', 'Full Name', 'Total Points', 'Voting Points', 'Contribution Points', 'Total Votes', 'Total Contributions', 'Status'],
      ...rankings.map(user => [
        user.rank,
        user.username,
        user.fullName,
        user.totalPoints,
        user.votingPoints,
        user.contributionPoints,
        user.totalVotes,
        user.totalContributions,
        user.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `points-ranking-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Rankings exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Points Ranking</h2>
          <p className="text-gray-600 mt-1">View and analyze user point rankings and leaderboards</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={loadRankings}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
          <motion.button
            onClick={exportRankings}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Points</p>
              <p className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</p>
            </div>
            <Target className="w-8 h-8 text-green-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Average Points</p>
              <p className="text-2xl font-bold">{stats.averagePoints}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Top Performer</p>
              <p className="text-lg font-bold truncate">
                {stats.topPerformer?.username || 'N/A'}
              </p>
              <p className="text-orange-200 text-sm">
                {stats.topPerformer?.totalPoints.toLocaleString()} pts
              </p>
            </div>
            <Trophy className="w-8 h-8 text-orange-200" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="voting">Voting Points</option>
            <option value="contribution">Contribution Points</option>
            <option value="bonus">Bonus Points</option>
          </select>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Breakdown
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Badges
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rankings.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getRankIcon(user.rank)}
                      {getRankChange(user.rank, user.previousRank)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.fullName}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                        {user.status === 'vip' && (
                          <div className="flex items-center gap-1 text-xs text-purple-600">
                            <Star className="w-3 h-3" />
                            VIP
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        {user.totalPoints.toLocaleString()}
                      </span>
                      {getPointsChange(user.pointsChange)}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Voting:</span>
                        <span className="font-medium">{user.votingPoints}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Contribution:</span>
                        <span className="font-medium">{user.contributionPoints}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Bonus:</span>
                        <span className="font-medium">{user.bonusPoints}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-blue-500" />
                        <span>{user.totalVotes} votes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-green-500" />
                        <span>{user.totalContributions} contributions</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Last: {new Date(user.lastActivity).toLocaleDateString()}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.badges.slice(0, 2).map((badge, badgeIndex) => (
                        <span
                          key={badgeIndex}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeColor(badge)}`}
                        >
                          {badge}
                        </span>
                      ))}
                      {user.badges.length > 2 && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          +{user.badges.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <motion.button
                      onClick={() => setShowDetails(user)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {showDetails && (
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
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowDetails(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <Eye className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {showDetails.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{showDetails.fullName}</h4>
                    <p className="text-gray-600">@{showDetails.username}</p>
                    <p className="text-sm text-gray-500">{showDetails.email}</p>
                  </div>
                </div>

                {/* Points Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{showDetails.totalPoints}</p>
                    <p className="text-sm text-blue-800">Total Points</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{showDetails.votingPoints}</p>
                    <p className="text-sm text-green-800">Voting</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{showDetails.contributionPoints}</p>
                    <p className="text-sm text-purple-800">Contribution</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">{showDetails.bonusPoints}</p>
                    <p className="text-sm text-orange-800">Bonus</p>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Voting Activity</h5>
                    <p className="text-2xl font-bold text-gray-900">{showDetails.totalVotes}</p>
                    <p className="text-sm text-gray-600">Total votes cast</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Contribution Activity</h5>
                    <p className="text-2xl font-bold text-gray-900">{showDetails.totalContributions}</p>
                    <p className="text-sm text-gray-600">Total contributions</p>
                  </div>
                </div>

                {/* Badges */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Badges & Achievements</h5>
                  <div className="flex flex-wrap gap-2">
                    {showDetails.badges.map((badge, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 text-sm font-medium rounded-full ${getBadgeColor(badge)}`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Timeline</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Joined:</span>
                      <span className="font-medium">{new Date(showDetails.joinDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Activity:</span>
                      <span className="font-medium">{new Date(showDetails.lastActivity).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Rank:</span>
                      <span className="font-medium">#{showDetails.rank}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PointsRanking;