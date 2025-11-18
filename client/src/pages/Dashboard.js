import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Vote, 
  Coins, 
  Users, 
  Settings,
  Copy,
  Eye,
  LogOut,
  User,
  Lock,
  Clock,
  Timer
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getUserMeta, getActivityLog, getActiveVotes as dsGetActiveVotes } from '../utils/datastore';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [pointsVoting, setPointsVoting] = useState(0);
  const [pointsContribution, setPointsContribution] = useState(0);
  const [pointsReferral, setPointsReferral] = useState(0);
  const [votesAllowed, setVotesAllowed] = useState(0);
  const [votesUsed, setVotesUsed] = useState(0);
  const [activeRoundsCount, setActiveRoundsCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);

  // Load live user dashboard data
  useEffect(() => {
    const load = () => {
      if (!user?.email) return;
      const meta = getUserMeta(user.email);
      setTotalPoints(meta.points || 0);
      setPointsVoting(meta.pointsVoting || 0);
      setPointsContribution(meta.pointsContribution || 0);
      setPointsReferral(meta.pointsReferral || 0);
      setVotesAllowed(meta.votesAllowed || 0);
      setVotesUsed(meta.votesUsed || 0);
      setActiveRoundsCount(dsGetActiveVotes().length);
      const activity = getActivityLog().filter((a) => a.userEmail === user.email);
      setRecentActivity(activity.slice(0, 10));
    };
    load();
    const onUpdate = () => load();
    window.addEventListener('datastore:update', onUpdate);
    return () => window.removeEventListener('datastore:update', onUpdate);
  }, [user?.email]);

  const copyReferralCode = () => {
    navigator.clipboard.writeText(user?.referralCode || 'DOA-JD-2024');
    toast.success('Referral code copied to clipboard!');
  };

  const handleVote = () => {
    navigate('/voting');
  };

  const handleContribute = () => {
    navigate('/contribute');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditProfile = () => {
    navigate('/profile');
  };

  const handleResetPassword = () => {
    // For now, just show a toast - this would typically open a modal or navigate to a reset page
    toast.info('Password reset functionality will be implemented soon');
  };

  if (!user) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient mobile-padding py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="mobile-header font-bold text-white mb-2">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-300 mobile-text">Ready to participate in the DOA ecosystem?</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-gray-300 text-sm">Current Balance</p>
              <p className="text-white font-semibold mobile-subheader">{totalPoints.toLocaleString()} Points</p>
            </div>
          </div>
        </motion.div>

        {/* Total Points Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mobile-glass rounded-xl mobile-card mb-6 sm:mb-8"
        >
          <div className="text-center">
            <h2 className="mobile-subheader font-bold text-white mb-2">Total Points</h2>
            <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              {totalPoints.toLocaleString()}
            </div>
            <p className="text-gray-300 mobile-text">
              Live points from your activity across the platform
            </p>
          </div>
        </motion.div>

        {/* Main Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 responsive-gap mb-6 sm:mb-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/voting')}
            className="mobile-glass rounded-xl mobile-card hover:bg-white/20 transition-all duration-300 group touch-target"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                <div className="p-3 sm:p-4 bg-purple-500/20 rounded-lg mr-4">
                  <Vote className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-white">VOTE</h3>
                  <p className="text-gray-300 text-sm sm:text-base">Cast your vote on decisions</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-yellow-400 font-semibold text-sm sm:text-base">
                  Active rounds: {activeRoundsCount}
                </div>
                <p className="text-gray-400 text-xs sm:text-sm">Voting status</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/contribute')}
            className="mobile-glass rounded-xl mobile-card hover:bg-white/20 transition-all duration-300 group touch-target"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                <div className="p-3 sm:p-4 bg-green-500/20 rounded-lg mr-4">
                  <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-white">CONTRIBUTE</h3>
                  <p className="text-gray-300 text-sm sm:text-base">Add funds and earn points</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-yellow-400 font-semibold text-sm sm:text-base">
                  Contribution points: {pointsContribution.toLocaleString()}
                </div>
                <p className="text-gray-400 text-xs sm:text-sm">Balance</p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Your Stats & Activity (Live) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mobile-glass rounded-xl mobile-card mb-6 sm:mb-8"
        >
          <h3 className="mobile-subheader font-bold text-white mb-4 sm:mb-6">Your Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 responsive-gap mb-6">
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">Voting Rights</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300 text-sm">Allowed:</span>
                  <span className="text-white font-semibold">{votesAllowed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300 text-sm">Used:</span>
                  <span className="text-white font-semibold">{votesUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300 text-sm">Remaining:</span>
                  <span className="text-green-400 font-semibold">{Math.max(0, votesAllowed - votesUsed)}</span>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">Voting Rounds</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300 text-sm">Active Rounds:</span>
                  <span className="text-white font-semibold">{activeRoundsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300 text-sm">Your Points:</span>
                  <span className="text-green-400 font-semibold">{totalPoints.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Points Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 responsive-gap mb-6">
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">Voting Points</h4>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Total:</span>
                <span className="text-white font-semibold">{pointsVoting.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">Contribution Points</h4>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Total:</span>
                <span className="text-white font-semibold">{pointsContribution.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">Referral Points</h4>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Total:</span>
                <span className="text-white font-semibold">{pointsReferral.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <h4 className="text-white font-semibold mb-3 text-sm sm:text-base">Your Recent Activity</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-gray-300 text-sm">No recent activity.</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="bg-white/10 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white text-sm font-medium">{activity.message}</span>
                    <span className="text-gray-400 text-xs">{new Date(activity.time).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-400 text-xs">{activity.type}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Settings Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mobile-glass rounded-xl mobile-card"
        >
          <h3 className="mobile-subheader font-bold text-white mb-4 sm:mb-6">Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 responsive-gap">
            <button className="flex items-center p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors group touch-target">
              <User className="w-5 h-5 text-blue-400 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <h4 className="text-white font-semibold text-sm sm:text-base">Edit Profile</h4>
                <p className="text-gray-400 text-xs sm:text-sm">Update your information</p>
              </div>
            </button>
            <button className="flex items-center p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors group touch-target">
              <Lock className="w-5 h-5 text-yellow-400 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <h4 className="text-white font-semibold text-sm sm:text-base">Reset Password</h4>
                <p className="text-gray-400 text-xs sm:text-sm">Change your password</p>
              </div>
            </button>
            <button 
              onClick={logout}
              className="flex items-center p-4 bg-white/10 rounded-lg hover:bg-red-500/20 transition-colors group touch-target"
            >
              <LogOut className="w-5 h-5 text-red-400 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <h4 className="text-white font-semibold text-sm sm:text-base">Log Out</h4>
                <p className="text-gray-400 text-xs sm:text-sm">End your session</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;