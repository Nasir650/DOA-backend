import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Vote,
  Plus,
  Edit3,
  Trash2,
  Play,
  Pause,
  Square,
  Clock,
  Users,
  BarChart3,
  Eye,
  Settings,
  Calendar,
  Timer,
  CheckCircle,
  X,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getVotes as dsGetVotes,
  addVote as dsAddVote,
  startVote as dsStartVote,
  pauseVote as dsPauseVote,
  resumeVote as dsResumeVote,
  completeVote as dsCompleteVote,
  deleteVote as dsDeleteVote,
} from '../../../utils/datastore';

const VotingManagement = () => {
  const [votes, setVotes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [selectedVote, setSelectedVote] = useState(null);
  const [newVote, setNewVote] = useState({
    title: '',
    description: '',
    options: ['', ''],
    duration: 24,
    pointsReward: 10,
    maxVotesPerUser: 1,
    isActive: false
  });

  useEffect(() => {
    loadVotes();
    const onUpdate = () => loadVotes();
    window.addEventListener('datastore:update', onUpdate);
    return () => window.removeEventListener('datastore:update', onUpdate);
  }, []);

  const loadVotes = () => {
    const list = dsGetVotes();
    setVotes(list);
  };

  const handleCreateVote = () => {
    if (!newVote.title || !newVote.description || newVote.options.some(opt => !opt.trim())) {
      toast.error('Please fill in all required fields');
      return;
    }
    const vote = dsAddVote({
      title: newVote.title,
      description: newVote.description,
      options: newVote.options.filter(opt => opt.trim()),
      pointsReward: newVote.pointsReward,
      maxVotesPerUser: newVote.maxVotesPerUser,
      durationHours: newVote.duration,
    });
    setSelectedVote(vote);
    loadVotes();
    setNewVote({
      title: '',
      description: '',
      options: ['', ''],
      duration: 24,
      pointsReward: 10,
      maxVotesPerUser: 1,
      isActive: false
    });
    setShowCreateModal(false);
    toast.success('Vote created and set active');
  };

  const handleStartVote = (id, duration = 24) => {
    dsStartVote(id, duration);
    loadVotes();
    toast.success(`Vote started! Ends in ${duration} hours`);
  };

  const handlePauseVote = (id) => {
    dsPauseVote(id);
    loadVotes();
    toast.success('Vote paused');
  };

  const handleStopVote = (id) => {
    dsCompleteVote(id);
    loadVotes();
    toast.success('Vote completed');
  };

  const handleDeleteVote = (id) => {
    dsDeleteVote(id);
    loadVotes();
    toast.success('Vote deleted');
  };

  const addOption = () => {
    setNewVote({
      ...newVote,
      options: [...newVote.options, '']
    });
  };

  const removeOption = (index) => {
    if (newVote.options.length > 2) {
      setNewVote({
        ...newVote,
        options: newVote.options.filter((_, i) => i !== index)
      });
    }
  };

  const updateOption = (index, value) => {
    const updatedOptions = [...newVote.options];
    updatedOptions[index] = value;
    setNewVote({
      ...newVote,
      options: updatedOptions
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeRemaining = (endTime) => {
    if (!endTime) return null;
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Voting Management</h2>
          <p className="text-gray-600 mt-1">Create and manage voting rounds with custom questions and timers</p>
        </div>
        <motion.button
          onClick={() => setShowCreateModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Create New Vote
        </motion.button>
      </div>

      {/* Votes List */}
      <div className="space-y-4">
        {votes.map((vote) => (
          <motion.div
            key={vote.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{vote.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vote.status)}`}>
                    {vote.status.charAt(0).toUpperCase() + vote.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{vote.description}</p>
                
                {/* Vote Stats */}
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{vote.totalVotes} votes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    <span>{vote.options.length} options</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Vote className="w-4 h-4" />
                    <span>Max {vote.maxVotesPerUser} vote{vote.maxVotesPerUser > 1 ? 's' : ''} per user</span>
                  </div>
                  {vote.status === 'active' && vote.endTime && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <Clock className="w-4 h-4" />
                      <span>{getTimeRemaining(vote.endTime)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {vote.status === 'draft' && (
                  <motion.button
                    onClick={() => {
                      setSelectedVote(vote);
                      setShowTimerModal(true);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200"
                  >
                    <Play className="w-4 h-4" />
                    Start
                  </motion.button>
                )}
                
                {vote.status === 'active' && (
                  <>
                    <motion.button
                      onClick={() => handlePauseVote(vote.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors duration-200"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </motion.button>
                    <motion.button
                      onClick={() => handleStopVote(vote.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </motion.button>
                  </>
                )}

                {vote.status === 'paused' && (
                  <motion.button
                    onClick={() => handleStartVote(vote.id, 24)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200"
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </motion.button>
                )}

                <motion.button
                  onClick={() => {
                    setSelectedVote(vote);
                    setShowResultsModal(true);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                >
                  <Eye className="w-4 h-4" />
                  Results
                </motion.button>

                <motion.button
                  onClick={() => handleDeleteVote(vote.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Options Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vote.options.slice(0, 4).map((option, index) => (
                <div key={option.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-900">{option.text}</span>
                  <span className="text-sm font-medium text-gray-600">{option.votes} votes</span>
                </div>
              ))}
              {vote.options.length > 4 && (
                <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                  +{vote.options.length - 4} more options
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Vote Modal */}
      <AnimatePresence>
        {showCreateModal && (
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
                <h3 className="text-xl font-bold text-gray-900">Create New Vote</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vote Title *
                  </label>
                  <input
                    type="text"
                    value={newVote.title}
                    onChange={(e) => setNewVote({ ...newVote, title: e.target.value })}
                    placeholder="Enter vote title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newVote.description}
                    onChange={(e) => setNewVote({ ...newVote, description: e.target.value })}
                    placeholder="Describe what users are voting for"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vote Options *
                  </label>
                  <div className="space-y-3">
                    {newVote.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        {newVote.options.length > 2 && (
                          <button
                            onClick={() => removeOption(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addOption}
                      className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      Add Option
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points Reward
                    </label>
                    <input
                      type="number"
                      value={newVote.pointsReward}
                      onChange={(e) => setNewVote({ ...newVote, pointsReward: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Votes Per User
                    </label>
                    <input
                      type="number"
                      value={newVote.maxVotesPerUser}
                      onChange={(e) => setNewVote({ ...newVote, maxVotesPerUser: parseInt(e.target.value) || 1 })}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (Hours)
                    </label>
                    <input
                      type="number"
                      value={newVote.duration}
                      onChange={(e) => setNewVote({ ...newVote, duration: parseInt(e.target.value) || 1 })}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Active vote will auto-end after selected hours.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVote}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                >
                  Create Vote
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer Modal */}
      <AnimatePresence>
        {showTimerModal && selectedVote && (
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
                <h3 className="text-xl font-bold text-gray-900">Set Vote Duration</h3>
                <button
                  onClick={() => setShowTimerModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">
                  How long should "{selectedVote.title}" run?
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[1, 6, 12, 24, 48, 72].map((hours) => (
                    <button
                      key={hours}
                      onClick={() => {
                        handleStartVote(selectedVote.id, hours);
                        setShowTimerModal(false);
                      }}
                      className="p-3 border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors duration-200 text-center"
                    >
                      <div className="font-medium text-gray-900">{hours} Hour{hours > 1 ? 's' : ''}</div>
                      <div className="text-sm text-gray-500">
                        {hours === 1 ? 'Quick poll' : 
                         hours <= 12 ? 'Short term' : 
                         hours <= 24 ? 'One day' : 'Extended'}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowTimerModal(false)}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Modal */}
      <AnimatePresence>
        {showResultsModal && selectedVote && (
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
                <h3 className="text-xl font-bold text-gray-900">Vote Results</h3>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{selectedVote.title}</h4>
                  <p className="text-gray-600">{selectedVote.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedVote.totalVotes}</p>
                    <p className="text-sm text-gray-500">Total Votes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedVote.options.length}</p>
                    <p className="text-sm text-gray-500">Options</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedVote.maxVotesPerUser}</p>
                    <p className="text-sm text-gray-500">Max Votes/User</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedVote.options
                    .sort((a, b) => b.votes - a.votes)
                    .map((option, index) => {
                      const percentage = selectedVote.totalVotes > 0 
                        ? (option.votes / selectedVote.totalVotes * 100).toFixed(1)
                        : 0;
                      
                      return (
                        <div key={option.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              {index === 0 && selectedVote.status === 'completed' && (
                                <CheckCircle className="w-4 h-4 text-green-500 inline mr-2" />
                              )}
                              {option.text}
                            </span>
                            <span className="text-sm text-gray-600">
                              {option.votes} votes ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className={`h-2 rounded-full ${
                                index === 0 ? 'bg-green-500' : 
                                index === 1 ? 'bg-blue-500' : 
                                index === 2 ? 'bg-purple-500' : 'bg-gray-400'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>

                {selectedVote.status === 'active' && selectedVote.endTime && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">
                        {getTimeRemaining(selectedVote.endTime)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VotingManagement;