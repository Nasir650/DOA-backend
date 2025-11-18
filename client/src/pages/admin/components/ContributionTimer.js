import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Timer, RefreshCw, Play, Square, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getContributionTimer as dsGetContributionTimer,
  clearContributionTimer as dsClearContributionTimer,
  getContributionRounds as dsGetContributionRounds,
  addContributionRound as dsAddContributionRound,
  pauseContributionRound as dsPauseContributionRound,
  resumeContributionRound as dsResumeContributionRound,
  stopContributionRound as dsStopContributionRound,
  deleteContributionRound as dsDeleteContributionRound,
} from '../../../utils/datastore';

const ContributionTimer = () => {
  const [currentTimer, setCurrentTimer] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', durationHours: 1 });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadAll();
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const onUpdate = () => loadAll();
    window.addEventListener('datastore:update', onUpdate);
    return () => {
      clearInterval(tick);
      window.removeEventListener('datastore:update', onUpdate);
    };
  }, []);

  const loadTimer = () => {
    const t = dsGetContributionTimer();
    setCurrentTimer(t);
  };

  const loadRounds = () => {
    const list = dsGetContributionRounds();
    setRounds(list);
  };

  const loadAll = () => {
    loadTimer();
    loadRounds();
  };

  const startTimer = () => {
    if (!form.name.trim()) {
      toast.error('Please enter a timer name');
      return;
    }
    const durationMs = (Number(form.durationHours) || 0) * 60 * 60 * 1000;
    const round = dsAddContributionRound({
      name: form.name,
      description: form.description,
      durationMs,
    });
    // addContributionRound keeps legacy timer in sync; refresh views
    loadAll();
    toast.success(`Round started: ${round.name}`);
  };

  const clearTimer = () => {
    dsClearContributionTimer();
    setCurrentTimer(null);
    toast.success('Contribution timer cleared');
  };

  const timeRemaining = () => {
    if (!currentTimer?.endTime) return null;
    const diff = currentTimer.endTime - now;
    if (diff <= 0) return '00:00:00';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const fmtMs = (ms) => {
    const safe = Math.max(0, Number(ms) || 0);
    const hours = Math.floor(safe / (1000 * 60 * 60));
    const minutes = Math.floor((safe % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((safe % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const pauseRound = (id) => {
    const r = dsPauseContributionRound(id);
    loadAll();
    if (r) toast.success('Round paused');
  };

  const resumeRound = (id) => {
    const r = dsResumeContributionRound(id);
    loadAll();
    if (r) toast.success('Round resumed');
  };

  const stopRound = (id) => {
    const r = dsStopContributionRound(id);
    loadAll();
    if (r) toast.success('Round stopped');
  };

  const deleteRound = (id) => {
    dsDeleteContributionRound(id);
    loadAll();
    toast.success('Round deleted');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contribution Timer</h2>
          <p className="text-gray-600 mt-1">Control when contributions are open and visible to users</p>
        </div>
        <motion.button
          onClick={loadTimer}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </motion.button>
      </div>

      {/* Create/Start Timer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Start a Contribution Window</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timer Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Weekly Contribution Round"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
            <input
              type="number"
              min="1"
              value={form.durationHours}
              onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Notes visible to admins"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <motion.button
            onClick={startTimer}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            <Play className="w-4 h-4" />
            Start Now
          </motion.button>
          {currentTimer && (
            <motion.button
              onClick={clearTimer}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
            >
              <Square className="w-4 h-4" />
              Clear Timer
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Current Timer Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
        </div>
        {!currentTimer ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>No active contribution timer. Users will not see countdown.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Timer</p>
              <p className="text-sm font-medium text-gray-900">{currentTimer.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Ends</p>
              <p className="text-sm font-medium text-gray-900">{new Date(currentTimer.endTime).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Time Remaining</p>
              <p className="font-mono font-bold text-red-600">{timeRemaining()}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Contribution Rounds Management */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Timer className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Contribution Rounds</h3>
        </div>

        {rounds.length === 0 ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
            No rounds created yet. Start one above to begin.
          </div>
        ) : (
          <div className="space-y-4">
            {rounds.map((r) => {
              const isRunning = r.status === 'running';
              const isPaused = r.status === 'paused';
              const isStopped = r.status === 'stopped';
              const remaining = isRunning ? Math.max(0, (r.endTime || now) - now) : (isPaused ? r.remainingMs : 0);
              return (
                <div key={r.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">{r.name}</p>
                      {r.description ? (
                        <p className="text-xs text-gray-500">{r.description}</p>
                      ) : null}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className={`text-sm font-semibold ${isRunning ? 'text-green-600' : isPaused ? 'text-yellow-600' : 'text-gray-600'}`}>{r.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Start</p>
                      <p className="text-sm font-medium text-gray-900">{new Date(r.startTime).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">End</p>
                      <p className="text-sm font-medium text-gray-900">{r.endTime ? new Date(r.endTime).toLocaleString() : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Remaining</p>
                      <p className="font-mono font-bold text-blue-600">{fmtMs(remaining)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <motion.button
                      onClick={() => pauseRound(r.id)}
                      whileHover={{ scale: isRunning ? 1.02 : 1 }}
                      whileTap={{ scale: isRunning ? 0.98 : 1 }}
                      disabled={!isRunning}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-colors duration-200 ${isRunning ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                    >
                      Pause
                    </motion.button>

                    <motion.button
                      onClick={() => resumeRound(r.id)}
                      whileHover={{ scale: isPaused ? 1.02 : 1 }}
                      whileTap={{ scale: isPaused ? 0.98 : 1 }}
                      disabled={!isPaused}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-colors duration-200 ${isPaused ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                    >
                      Resume
                    </motion.button>

                    <motion.button
                      onClick={() => stopRound(r.id)}
                      whileHover={{ scale: !isStopped ? 1.02 : 1 }}
                      whileTap={{ scale: !isStopped ? 0.98 : 1 }}
                      disabled={isStopped}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-colors duration-200 ${!isStopped ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                    >
                      Stop
                    </motion.button>

                    <motion.button
                      onClick={() => deleteRound(r.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-3 py-1 rounded-lg border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors duration-200"
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ContributionTimer;