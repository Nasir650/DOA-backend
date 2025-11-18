import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock,
  Play,
  Pause,
  Square,
  Timer,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Settings,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const VotingTimer = () => {
  const [timers, setTimers] = useState([]);
  const [newTimer, setNewTimer] = useState({
    name: '',
    duration: 60, // minutes
    description: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadTimers = () => {
    // Mock data - replace with actual API call
    const mockTimers = [
      {
        id: 1,
        name: 'Weekly Community Vote',
        description: 'Regular weekly voting session for community proposals',
        duration: 120, // minutes
        startTime: new Date(Date.now() - 30 * 60 * 1000), // Started 30 minutes ago
        endTime: new Date(Date.now() + 90 * 60 * 1000), // Ends in 90 minutes
        status: 'active',
        participantsCount: 45,
        votesCount: 38,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        autoClose: true
      },
      {
        id: 2,
        name: 'Emergency Proposal Vote',
        description: 'Urgent vote on emergency protocol changes',
        duration: 30, // minutes
        startTime: null,
        endTime: null,
        status: 'scheduled',
        participantsCount: 0,
        votesCount: 0,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        autoClose: true
      },
      {
        id: 3,
        name: 'Monthly Feature Vote',
        description: 'Vote on new features for next month',
        duration: 180, // minutes
        startTime: new Date(Date.now() - 200 * 60 * 1000), // Started 200 minutes ago
        endTime: new Date(Date.now() - 20 * 60 * 1000), // Ended 20 minutes ago
        status: 'completed',
        participantsCount: 78,
        votesCount: 72,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        autoClose: true
      }
    ];

    setTimers(mockTimers);
  };

  const updateTimers = () => {
    setTimers(prevTimers => 
      prevTimers.map(timer => {
        if (timer.status === 'active' && timer.endTime) {
          const now = new Date();
          if (now >= timer.endTime && timer.autoClose) {
            toast.success(`Voting timer "${timer.name}" has ended automatically`);
            return { ...timer, status: 'completed' };
          }
        }
        return timer;
      })
    );
  };

  const createTimer = () => {
    if (!newTimer.name.trim()) {
      toast.error('Please enter a timer name');
      return;
    }

    const timer = {
      id: Date.now(),
      name: newTimer.name,
      description: newTimer.description,
      duration: newTimer.duration,
      startTime: null,
      endTime: null,
      status: 'scheduled',
      participantsCount: 0,
      votesCount: 0,
      createdAt: new Date(),
      autoClose: true
    };

    setTimers([...timers, timer]);
    setNewTimer({ name: '', duration: 60, description: '' });
    setShowCreateForm(false);
    toast.success('Voting timer created successfully');
  };

  const startTimer = (timerId) => {
    setTimers(timers.map(timer => {
      if (timer.id === timerId) {
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + timer.duration * 60 * 1000);
        return {
          ...timer,
          status: 'active',
          startTime,
          endTime
        };
      }
      return timer;
    }));
    toast.success('Voting timer started');
  };

  const pauseTimer = (timerId) => {
    setTimers(timers.map(timer => {
      if (timer.id === timerId) {
        return { ...timer, status: 'paused' };
      }
      return timer;
    }));
    toast.success('Voting timer paused');
  };

  const stopTimer = (timerId) => {
    setTimers(timers.map(timer => {
      if (timer.id === timerId) {
        return { ...timer, status: 'completed' };
      }
      return timer;
    }));
    toast.success('Voting timer stopped');
  };

  const deleteTimer = (timerId) => {
    setTimers(timers.filter(timer => timer.id !== timerId));
    toast.success('Voting timer deleted');
  };

  const formatTimeRemaining = (endTime) => {
    if (!endTime) return '--:--:--';
    
    const now = new Date();
    const diff = endTime - now;
    
    if (diff <= 0) return '00:00:00';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4 text-green-500" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-gray-500" />;
      case 'scheduled': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Voting Timers</h2>
          <p className="text-gray-600 mt-1">Manage voting session timers and automatic closure</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={loadTimers}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </motion.button>
          <motion.button
            onClick={() => setShowCreateForm(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            <Timer className="w-4 h-4" />
            Create Timer
          </motion.button>
        </div>
      </div>

      {/* Create Timer Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Voting Timer</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timer Name
              </label>
              <input
                type="text"
                value={newTimer.name}
                onChange={(e) => setNewTimer({ ...newTimer, name: e.target.value })}
                placeholder="Enter timer name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={newTimer.duration}
                onChange={(e) => setNewTimer({ ...newTimer, duration: parseInt(e.target.value) || 60 })}
                min="1"
                max="1440"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={newTimer.description}
              onChange={(e) => setNewTimer({ ...newTimer, description: e.target.value })}
              placeholder="Enter timer description..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              onClick={createTimer}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              Create Timer
            </motion.button>
            <motion.button
              onClick={() => setShowCreateForm(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Active Timers Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-900">
                {timers.filter(t => t.status === 'active').length}
              </div>
              <div className="text-sm text-green-600">Active Timers</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {timers.filter(t => t.status === 'scheduled').length}
              </div>
              <div className="text-sm text-blue-600">Scheduled</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Pause className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-900">
                {timers.filter(t => t.status === 'paused').length}
              </div>
              <div className="text-sm text-yellow-600">Paused</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {timers.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timers List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Voting Timers</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {timers.map((timer, index) => (
            <motion.div
              key={timer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{timer.name}</h4>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(timer.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(timer.status)}`}>
                        {timer.status.charAt(0).toUpperCase() + timer.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {timer.description && (
                    <p className="text-gray-600 mb-3">{timer.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <div className="font-medium">{timer.duration} minutes</div>
                    </div>
                    
                    {timer.status === 'active' && (
                      <div>
                        <span className="text-gray-500">Time Remaining:</span>
                        <div className="font-mono text-lg font-bold text-red-600">
                          {formatTimeRemaining(timer.endTime)}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-gray-500">Participants:</span>
                      <div className="font-medium">{timer.participantsCount}</div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Votes Cast:</span>
                      <div className="font-medium">{timer.votesCount}</div>
                    </div>
                  </div>

                  {timer.startTime && (
                    <div className="mt-3 text-sm text-gray-500">
                      Started: {timer.startTime.toLocaleString()}
                      {timer.endTime && ` • Ends: ${timer.endTime.toLocaleString()}`}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {timer.status === 'scheduled' && (
                    <motion.button
                      onClick={() => startTimer(timer.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200"
                      title="Start timer"
                    >
                      <Play className="w-4 h-4" />
                    </motion.button>
                  )}

                  {timer.status === 'active' && (
                    <>
                      <motion.button
                        onClick={() => pauseTimer(timer.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors duration-200"
                        title="Pause timer"
                      >
                        <Pause className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => stopTimer(timer.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
                        title="Stop timer"
                      >
                        <Square className="w-4 h-4" />
                      </motion.button>
                    </>
                  )}

                  {timer.status === 'paused' && (
                    <motion.button
                      onClick={() => startTimer(timer.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200"
                      title="Resume timer"
                    >
                      <Play className="w-4 h-4" />
                    </motion.button>
                  )}

                  {(timer.status === 'completed' || timer.status === 'scheduled') && (
                    <motion.button
                      onClick={() => deleteTimer(timer.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
                      title="Delete timer"
                    >
                      <Square className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Progress Bar for Active Timers */}
              {timer.status === 'active' && timer.startTime && timer.endTime && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>
                      {Math.round(((new Date() - timer.startTime) / (timer.endTime - timer.startTime)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((new Date() - timer.startTime) / (timer.endTime - timer.startTime)) * 100))}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {timers.length === 0 && (
          <div className="text-center py-12">
            <Timer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No voting timers created yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingTimer;