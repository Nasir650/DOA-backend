import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Vote, 
  Clock, 
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getUserMeta, castVote, getActiveVotes as dsGetActiveVotes, submitVoteOption as dsSubmitVoteOption, addPoints } from '../utils/datastore';

const Voting = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const [votesRemaining, setVotesRemaining] = useState(0);
  const [votesAllowed, setVotesAllowed] = useState(0);
  const [activeVotes, setActiveVotes] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [selectedOptions, setSelectedOptions] = useState({}); // { [voteId]: optionId }

  // No dummy stats/history; page reflects live datastore state only

  // Active votes loader and countdown ticker
  useEffect(() => {
    const load = () => setActiveVotes(dsGetActiveVotes());
    load();
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const onUpdate = () => load();
    window.addEventListener('datastore:update', onUpdate);
    return () => {
      clearInterval(tick);
      window.removeEventListener('datastore:update', onUpdate);
    };
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    const meta = getUserMeta(user.email);
    const remaining = (meta.votesAllowed || 0) - (meta.votesUsed || 0);
    setVotesAllowed(meta.votesAllowed || 0);
    setVotesRemaining(Math.max(0, remaining));
    const onUpdate = () => {
      const m = getUserMeta(user.email);
      const r = (m.votesAllowed || 0) - (m.votesUsed || 0);
      setVotesAllowed(m.votesAllowed || 0);
      setVotesRemaining(Math.max(0, r));
    };
    window.addEventListener('datastore:update', onUpdate);
    return () => window.removeEventListener('datastore:update', onUpdate);
  }, [user?.email]);

  // Removed dummy handlers and reset logic

  const formatRemaining = (endIso) => {
    if (!endIso) return null;
    const end = new Date(endIso).getTime();
    const diff = end - now;
    if (diff <= 0) return 'Ended';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const onSelectOption = (vote, option) => {
    if (!user?.email) {
      toast.error('Please log in to vote.');
      return;
    }
    const usedByUser = (vote?.submissions?.[user.email]) || 0;
    const perRoundRemaining = (vote?.maxVotesPerUser || 1) - usedByUser;
    if (perRoundRemaining <= 0) {
      toast.error('No rights remaining for this round.');
      return;
    }
    // Rights are per round; no global gating
    setSelectedOptions((prev) => ({ ...prev, [vote.id]: option.id }));
    toast.success(`Selected: ${option.text}`);
  };

  const onSubmitVote = (vote) => {
    if (!user?.email || !vote) return;
    const selectedOptionId = selectedOptions[vote.id];
    if (selectedOptionId == null) {
      toast.error('Please select an option first.');
      return;
    }
    const usedByUser = (vote?.submissions?.[user.email]) || 0;
    const perRoundRemaining = (vote?.maxVotesPerUser || 1) - usedByUser;
    if (perRoundRemaining <= 0) {
      toast.error('No rights remaining for this round.');
      return;
    }
    // Submit vote relying solely on per-round rights
    const res = dsSubmitVoteOption({ voteId: vote.id, userEmail: user.email, optionId: selectedOptionId });
    if (!res.ok) {
      toast.error(res.error || 'Unable to submit vote');
      return;
    }
    // Award voting points for this round
    if (vote.pointsReward) {
      addPoints(user.email, vote.pointsReward, 'voting');
    }
    // update local activeVotes
    setActiveVotes((prev) => prev.map((v) => (v.id === vote.id ? res.vote : v)));
    setSelectedOptions((prev) => ({ ...prev, [vote.id]: null }));
    toast.success('Your vote has been submitted.');
  };

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-white text-xl">Loading voting data...</div>
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
          <h1 className="mobile-header font-bold text-white mb-2">
            Voting
          </h1>
          <p className="text-gray-300 mobile-text">
            Participate in community decisions.
          </p>
        </motion.div>

        {/* Voting Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mobile-glass rounded-xl mobile-card mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Vote className="w-6 h-6 text-green-400 mr-3" />
              <div>
                <h3 className="text-lg font-bold text-white">Voting Status</h3>
                <p className="text-gray-300 text-sm">
                  Voting rights: <span className="text-green-400 font-bold">{votesRemaining}</span> of <span className="text-green-400 font-bold">{votesAllowed}</span> remaining
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{(activeVotes || []).reduce((sum, v) => sum + (v.totalVotes || 0), 0)}</div>
                <div className="text-gray-300 text-sm">Total Votes Across Active Rounds</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Active Votes (admin-set) */}
        <div className="mb-8">
          {(!activeVotes || activeVotes.length === 0) ? (
            <div className="mobile-glass rounded-xl mobile-card p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <p className="text-gray-300">No active voting round. Please check back later.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {activeVotes.map((vote) => (
                <motion.div
                  key={vote.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mobile-glass rounded-xl mobile-card p-6"
                >
                  <div className="flex items-center mb-4">
                    <BarChart3 className="w-6 h-6 text-blue-400 mr-3" />
                    <h3 className="text-xl font-bold text-white">{vote.title}</h3>
                  </div>
                  {vote.description && (
                    <p className="text-gray-300 text-sm mb-6">{vote.description}</p>
                  )}
                  {vote.endTime && (
                    <div className="mb-4 p-3 bg-white/5 rounded-lg flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="text-gray-200 text-sm">Time remaining:</span>
                      <span className="font-mono font-semibold text-white">{formatRemaining(vote.endTime)}</span>
                    </div>
                  )}
                  <div className="space-y-3">
                    {vote.options.map((opt) => {
                      const isSelected = selectedOptions[vote.id] === opt.id;
                      const usedByUser = (vote?.submissions?.[user?.email]) || 0;
                      const perRoundRemaining = (vote?.maxVotesPerUser || 1) - usedByUser;
                      const disabled = vote.status !== 'active' || perRoundRemaining <= 0;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => !disabled && onSelectOption(vote, opt)}
                          disabled={disabled}
                          className={`w-full p-4 rounded-lg border-2 transition-all duration-300 flex items-center justify-between ${
                            isSelected ? 'border-blue-400/80 bg-white/5' : 'border-white/10 hover:border-blue-400/60'
                          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 ${
                              isSelected ? 'border-blue-400 bg-blue-500' : 'border-gray-400 bg-transparent'
                            }`}></div>
                            <span className="font-semibold text-white">{opt.text}</span>
                          </div>
                          <span className="text-sm text-gray-300">{opt.votes || 0} votes</span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Per-round rights display */}
                  <div className="mt-3 p-3 bg-white/5 rounded-lg flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Round rights (you):</span>
                    <span className="text-white text-sm font-semibold">
                      {Math.max(0, (vote.maxVotesPerUser || 1) - ((vote.submissions?.[user?.email]) || 0))} of {vote.maxVotesPerUser || 1} remaining
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-3">
                    <button
                      onClick={() => onSubmitVote(vote)}
                      disabled={selectedOptions[vote.id] == null || vote.status !== 'active' || (((vote.submissions?.[user?.email]) || 0) >= (vote.maxVotesPerUser || 1))}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-colors duration-200"
                    >
                      Submit Vote
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* No dummy stats/history. Only live active votes are shown. */}
      </div>
    </div>
  );
};

export default Voting;