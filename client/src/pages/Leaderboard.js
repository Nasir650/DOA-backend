import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Users, 
  Award,
  Star,
  Target,
  Calendar,
  Filter,
  Search,
  ChevronUp,
  ChevronDown,
  User,
  Coins,
  Vote
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { getUsersList, getUserMeta, getReceipts } from '../utils/datastore';
import toast from 'react-hot-toast';

const Leaderboard = () => {
  const { user } = useContext(AuthContext);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');
  const [category, setCategory] = useState('total');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPoints: 0,
    averagePoints: 0
  });

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe, category, currentPage]);

  // Auto-refresh when datastore updates (e.g., admin verifies receipts or points change)
  useEffect(() => {
    const onUpdate = () => {
      fetchLeaderboard();
    };
    window.addEventListener('datastore:update', onUpdate);
    return () => window.removeEventListener('datastore:update', onUpdate);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      // Build real leaderboard from datastore
      const users = getUsersList();
      const receipts = getReceipts();

      let data = users.map(u => {
        const meta = getUserMeta(u.email);
        const username = (u.email || '').split('@')[0];
        const contributionsCount = receipts.filter(r => r.userEmail === u.email && r.verified).length;
        return {
          _id: u.email,
          username,
          firstName: u.name || username,
          lastName: '',
          email: u.email,
          role: u.role,
          points: {
            total: meta.points || 0,
            voting: meta.pointsVoting || 0,
            contributions: meta.pointsContribution || 0,
          },
          stats: {
            totalVotes: meta.votesUsed || 0,
            totalContributions: contributionsCount,
          },
          createdAt: u.createdAt || new Date().toISOString(),
          lastActivity: null,
          profileImage: null,
          fullName: u.name || username,
          badges: [],
        };
      });

      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        data = data.filter(user => 
          (user.username || '').toLowerCase().includes(term) ||
          (user.fullName || '').toLowerCase().includes(term)
        );
      }

      // Sort by selected category points (desc)
      const sortByCategory = (a, b) => {
        const getCat = (ud) => {
          switch (category) {
            case 'voting': return ud.points?.voting || 0;
            case 'contributions': return ud.points?.contributions || 0;
            case 'total':
            default: return ud.points?.total || 0;
          }
        };
        return getCat(b) - getCat(a);
      };
      data.sort(sortByCategory);

      // Pagination
      const startIndex = (currentPage - 1) * 50;
      const endIndex = startIndex + 50;
      const paginatedData = data.slice(startIndex, endIndex);

      setLeaderboard(paginatedData);
      setTotalPages(Math.ceil(data.length / 50));

      // Compute stats (all-time totals)
      const totalUsers = users.length;
      const totalPoints = data.reduce((sum, u) => sum + (u.points?.total || 0), 0);
      const activeUsers = data.filter(u => (u.points?.total || 0) > 0).length;
      const averagePoints = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;
      setStats({ totalUsers, activeUsers, totalPoints, averagePoints });

      // Current user rank (all-time total points)
      if (user?.email) {
        const rankIndex = data.findIndex(u => u.email === user.email);
        if (rankIndex !== -1) {
          setUserRank({ position: rankIndex + 1, user: data[rankIndex] });
        } else {
          setUserRank(null);
        }
      } else {
        setUserRank(null);
      }

    } catch (error) {
      console.error('Fetch leaderboard error:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Trophy className="w-6 h-6 text-orange-500" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold">
            {position}
          </div>
        );
    }
  };

  const getRankColor = (position) => {
    switch (position) {
      case 1:
        return 'from-yellow-500 to-yellow-600';
      case 2:
        return 'from-gray-400 to-gray-500';
      case 3:
        return 'from-orange-500 to-orange-600';
      default:
        return 'from-purple-500 to-purple-600';
    }
  };

  const getPointsForCategory = (userData, cat) => {
    switch (cat) {
      case 'voting':
        return userData.points?.voting || 0;
      case 'contributions':
        return userData.points?.contributions || 0;
      case 'total':
      default:
        return userData.points?.total || 0;
    }
  };

  const LeaderboardCard = ({ userData, position, isCurrentUser = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.05 }}
      className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border transition-all duration-300 ${
        isCurrentUser 
          ? 'border-purple-400 bg-purple-500/20' 
          : 'border-white/20 hover:border-white/30'
      } ${position <= 3 ? 'relative overflow-hidden' : ''}`}
    >
      {/* Top 3 Background Effect */}
      {position <= 3 && (
        <div className={`absolute inset-0 bg-gradient-to-r ${getRankColor(position)} opacity-10`} />
      )}
      
      <div className="relative flex items-center space-x-4">
        {/* Rank */}
        <div className="flex-shrink-0">
          {getRankIcon(position)}
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0">
          {userData.profileImage ? (
            <img 
              src={userData.profileImage} 
              alt={userData.firstName}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
            />
          ) : (
            <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRankColor(position)} flex items-center justify-center`}>
              <User className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-white font-semibold truncate">
              {userData.firstName} {userData.lastName}
            </h3>
            {isCurrentUser && (
              <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">You</span>
            )}
            {userData.role === 'admin' && (
              <Crown className="w-4 h-4 text-yellow-500" />
            )}
          </div>
          <p className="text-gray-400 text-sm">
            Member since {new Date(userData.createdAt).toLocaleDateString()}
          </p>
          {userData.bio && (
            <p className="text-gray-300 text-sm mt-1 line-clamp-1">{userData.bio}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center space-x-1 mb-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-white font-bold text-lg">
              {getPointsForCategory(userData, category).toLocaleString()}
            </span>
          </div>
          <p className="text-gray-400 text-xs">
            {category === 'total' ? 'Total Points' : 
             category === 'voting' ? 'Voting Points' : 'Contribution Points'}
          </p>
          
          {/* Additional Stats */}
          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-400">
            <div className="flex items-center space-x-1" title="Total votes cast by this user">
              <Vote className="w-3 h-3 cursor-help" />
              <span>{userData.stats?.totalVotes || 0}</span>
            </div>
            <div className="flex items-center space-x-1" title="Total contributions made by this user">
              <Coins className="w-3 h-3 cursor-help" />
              <span>{userData.stats?.totalContributions || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar for Top 10 */}
      {position <= 10 && leaderboard.length > 0 && (
        <div className="mt-4">
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className={`h-2 rounded-full bg-gradient-to-r ${getRankColor(position)}`}
              style={{
                width: `${(getPointsForCategory(userData, category) / getPointsForCategory(leaderboard[0], category)) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "purple" }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
    >
      <div className="flex items-center space-x-3">
        <div className={`p-3 rounded-xl bg-gradient-to-r from-${color}-500 to-${color}-600`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
          <p className="text-gray-300 text-sm">{title}</p>
          {subtitle && <p className="text-gray-400 text-xs">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">🏆 Leaderboard</h1>
          <p className="text-gray-300">
            See how you rank among the community members and celebrate top contributors.
          </p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Total Users"
            value={stats.totalUsers?.toLocaleString() || '0'}
            color="blue"
          />
          <StatCard
            icon={TrendingUp}
            title="Active Users"
            value={stats.activeUsers?.toLocaleString() || '0'}
            subtitle="Last 30 days"
            color="green"
          />
          <StatCard
            icon={Star}
            title="Total Points"
            value={stats.totalPoints?.toLocaleString() || '0'}
            color="yellow"
          />
          <StatCard
            icon={Target}
            title="Average Points"
            value={Math.round(stats.averagePoints || 0).toLocaleString()}
            color="purple"
          />
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="total">Total Points</option>
                  <option value="voting">Voting Points</option>
                  <option value="contributions">Contribution Points</option>
                </select>
              </div>

              {/* Timeframe Filter */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="all">All Time</option>
                  <option value="month">This Month</option>
                  <option value="week">This Week</option>
                  <option value="today">Today</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>
        </motion.div>

        {/* Your Rank (if not in top visible) */}
        {userRank && userRank.position > 10 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-white mb-4">Your Ranking</h2>
            <LeaderboardCard 
              userData={userRank.user} 
              position={userRank.position} 
              isCurrentUser={true}
            />
          </motion.div>
        )}

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">🥇 Top Champions 🥇</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 2nd Place */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="order-1 md:order-1"
              >
                <LeaderboardCard 
                  userData={leaderboard[1]} 
                  position={2} 
                  isCurrentUser={user?._id === leaderboard[1]?._id}
                />
              </motion.div>

              {/* 1st Place */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="order-2 md:order-2"
              >
                <div className="relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-3 py-1 rounded-full text-sm font-bold">
                      👑 CHAMPION
                    </div>
                  </div>
                  <LeaderboardCard 
                    userData={leaderboard[0]} 
                    position={1} 
                    isCurrentUser={user?._id === leaderboard[0]?._id}
                  />
                </div>
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="order-3 md:order-3"
              >
                <LeaderboardCard 
                  userData={leaderboard[2]} 
                  position={3} 
                  isCurrentUser={user?._id === leaderboard[2]?._id}
                />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Full Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Full Rankings</h2>
            <div className="text-gray-400 text-sm">
              Showing {((currentPage - 1) * 50) + 1}-{Math.min(currentPage * 50, leaderboard.length)} of {leaderboard.length}
            </div>
          </div>

          {leaderboard.length > 0 ? (
            <div className="space-y-4">
              {leaderboard.map((userData, index) => {
                const position = ((currentPage - 1) * 50) + index + 1;
                return (
                  <LeaderboardCard
                    key={userData._id}
                    userData={userData}
                    position={position}
                    isCurrentUser={user?._id === userData._id}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
              <p className="text-gray-400">
                {searchTerm 
                  ? 'Try adjusting your search criteria.'
                  : 'Be the first to earn points and claim the top spot!'
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Leaderboard;