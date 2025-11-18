import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { addReceipt as dsAddReceipt, getActiveWallets as dsGetActiveWallets, getContributionTimer as dsGetContributionTimer, getReceipts as dsGetReceipts, getUsersMap as dsGetUsersMap } from '../utils/datastore';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  Coins, 
  Users, 
  DollarSign,
  QrCode,
  Copy,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Contribute = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timer, setTimer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [selectedCoin, setSelectedCoin] = useState('');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [recentContributions, setRecentContributions] = useState([]);
  
  // Load admin-defined wallets and contribution timer
  useEffect(() => {
    const load = () => {
      setWallets(dsGetActiveWallets());
      const t = dsGetContributionTimer();
      setTimer(t);
      const raw = dsGetReceipts();
      const users = dsGetUsersMap ? dsGetUsersMap() : {};
      const mapped = raw.map((r) => ({
        id: r.id,
        user: ((users[r.userEmail]?.email || r.userEmail || '').split('@')[0]) || 'user',
        amount: r.amount || 0,
        currency: r.currency || 'USD',
        usdValue: r.amount || 0,
        status: r.verified ? 'verified' : (r.status || 'pending'),
        submittedAt: new Date(r.time).toISOString(),
        pointsAwarded: r.verified ? Math.floor(r.amount || 0) : 0,
      }))
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 5);
      setRecentContributions(mapped);
    };
    load();
    const onUpdate = () => load();
    window.addEventListener('datastore:update', onUpdate);
    return () => window.removeEventListener('datastore:update', onUpdate);
  }, []);

  // Contribution tiers removed

  // Timer countdown effect from datastore
  useEffect(() => {
    const interval = setInterval(() => {
      if (!timer?.endTime) {
        setCountdown('');
        return;
      }
      const now = Date.now();
      const diff = timer.endTime - now;
      if (diff <= 0) {
        setCountdown('00:00:00');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Calculate crypto amount when USD amount or coin changes
  useEffect(() => {
    if (amount && selectedCoin) {
      const w = wallets.find(c => c.symbol === selectedCoin);
      if (w && w.rate) {
        const cryptoValue = (parseFloat(amount) / Number(w.rate)).toFixed(6);
        setCryptoAmount(cryptoValue);
        setWalletAddress(w.address);
      } else if (w) {
        setWalletAddress(w.address);
        setCryptoAmount('');
      }
    } else {
      setCryptoAmount('');
      setWalletAddress('');
    }
  }, [amount, selectedCoin, wallets]);

  const getPointsForAmount = (usdAmount) => {
    const amt = parseFloat(usdAmount);
    if (amt >= 1000) return 1000;
    if (amt >= 500) return 300;
    if (amt >= 100) return 80;
    if (amt >= 50) return 15;
    return 0;
  };

  const handleGenerateQR = () => {
    if (!amount || !selectedCoin) {
      toast.error('Please enter an amount and select a cryptocurrency');
      return;
    }
    
    if (parseFloat(amount) < 50) {
      toast.error('Minimum contribution amount is $50');
      return;
    }

    setShowQR(true);
    toast.success('QR code generated! Scan to send payment');
  };

  const copyWalletAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success('Wallet address copied!');
  };

  // Referral removed

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Generate a simple QR code placeholder (in real app, use a QR library)
  const generateQRCodeData = () => {
    return `${selectedCoin}:${walletAddress}?amount=${cryptoAmount}&label=DOA Contribution`;
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PNG, JPG, and PDF files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }
    setReceiptFile(file);
  };

  const handleSubmitProof = async () => {
    try {
      if (!amount || parseFloat(amount) < 50) {
        toast.error('Minimum contribution amount is $50');
        return;
      }
      if (!selectedCoin) {
        toast.error('Please select a cryptocurrency');
        return;
      }
      if (!walletAddress) {
        toast.error('Wallet address is missing');
        return;
      }
      if (!receiptFile) {
        toast.error('Please upload a receipt (screenshot or PDF)');
        return;
      }

      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('receipt', receiptFile);
      formData.append('amount', amount);
      formData.append('currency', selectedCoin);
      formData.append('walletAddress', walletAddress);
      if (transactionHash) formData.append('transactionHash', transactionHash);

      const { data } = await axios.post('/api/contributions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data?.success) {
        // Also record locally so admin views reflect immediately
        dsAddReceipt({
          userEmail: user?.email || 'anonymous@local',
          amount: Number(amount) || 0,
          currency: selectedCoin || 'USD',
          url: data?.data?.receiptUrl || transactionHash || '',
          notes: `Uploaded via API${transactionHash ? ` • tx ${transactionHash}` : ''}`
        });
        toast.success('Proof submitted! We will review and credit points.');
        setReceiptFile(null);
        setTransactionHash('');
        setShowQR(false);
        setAmount('');
        setSelectedCoin('');
        setWalletAddress('');
        setCryptoAmount('');
      } else {
        toast.error(data?.message || 'Failed to submit proof');
      }
    } catch (err) {
      // Fallback: store receipt locally
      dsAddReceipt({
        userEmail: user?.email || 'anonymous@local',
        amount: Number(amount) || 0,
        currency: selectedCoin || 'USD',
        url: transactionHash || '',
        notes: receiptFile?.name || 'Local submission'
      });
      toast.success('Proof saved locally. Admin can verify and award points.');
      setReceiptFile(null);
      setTransactionHash('');
      setShowQR(false);
      setAmount('');
      setSelectedCoin('');
      setWalletAddress('');
      setCryptoAmount('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-6 sm:mb-8"
        >
          <button
            onClick={handleBackToDashboard}
            className="mr-3 sm:mr-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Contribute</h1>
            <p className="text-sm sm:text-base text-gray-300">Add funds and earn points</p>
          </div>
        </motion.div>

        {/* Timer Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-effect rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-center"
        >
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mr-2 sm:mr-3" />
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Contribution Round</h2>
          </div>
          {timer?.endTime ? (
            <>
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-gradient mb-2">
                {countdown}
              </div>
              <p className="text-sm sm:text-base text-gray-300">Until the current contribution round ends</p>
            </>
          ) : (
            <p className="text-sm sm:text-base text-gray-300">No active contribution timer set by admin</p>
          )}
        </motion.div>

        {/* Contribution Tiers & Referral */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 mb-6 sm:mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tiers */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Contribution Tiers & Points</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
                  <span className="text-gray-300">$50–$99</span>
                  <span className="text-green-400 font-semibold">15 points</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
                  <span className="text-gray-300">$100–$299</span>
                  <span className="text-green-400 font-semibold">30 points</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
                  <span className="text-gray-300">$300–$499</span>
                  <span className="text-green-400 font-semibold">100 points</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
                  <span className="text-gray-300">$500–$999</span>
                  <span className="text-green-400 font-semibold">300 points</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
                  <span className="text-gray-300">$1000–∞</span>
                  <span className="text-green-400 font-semibold">1000 points</span>
                </div>
              </div>
            </div>

            {/* Referral Note */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Referral</h3>
              <div className="space-y-2">
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300">
                  Refer other victims and earn 10 points
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-purple-300">
                  Referral link →
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contribution Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mobile-glass rounded-xl mobile-card mb-6 sm:mb-8"
        >
          <h3 className="mobile-subheader font-bold text-white mb-4 sm:mb-6">Make a Contribution</h3>
          
          {/* Amount Input */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-white font-semibold mb-2 mobile-text">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1" />
              Enter Amount in USD
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="$50"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 sm:px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none mobile-text touch-target"
              min="50"
            />
            <p className="mt-2 text-xs sm:text-sm text-gray-300">Enter amount in USD</p>
            {amount && (
              <div className="mt-2 text-xs sm:text-sm">
                <span className="text-gray-300">You will earn: </span>
                <span className="text-green-400 font-bold">
                  {getPointsForAmount(amount)} points
                </span>
              </div>
            )}
          </div>

          {/* Cryptocurrency Selection */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-white font-semibold mb-2 mobile-text">
              Select Cryptocurrency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 responsive-gap">
              {(wallets.length > 0 ? wallets : [
                { symbol: 'XRP', name: 'XRP' },
                { symbol: 'BNB', name: 'BNB' },
                { symbol: 'TRON', name: 'TRON' },
                { symbol: 'SOL', name: 'Solana' },
                { symbol: 'ETH', name: 'Ethereum' },
                { symbol: 'BTC', name: 'Bitcoin' },
                { symbol: 'USDT-CRC20', name: 'USDT (CRC20)' },
                { symbol: 'USDT-BSC', name: 'USDT (BSC)' },
                { symbol: 'USDT-TRC20', name: 'USDT (TRC20)' },
              ]).map((crypto) => (
                <button
                  key={crypto.symbol}
                  onClick={() => setSelectedCoin(crypto.symbol)}
                  className={`p-2 sm:p-3 rounded-lg border-2 transition-all duration-300 touch-target ${
                    selectedCoin === crypto.symbol
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/20 bg-white/5 text-gray-300 hover:border-purple-400'
                  }`}
                  disabled={wallets.length === 0}
                >
                  <div className="font-bold text-sm sm:text-base">{crypto.symbol}</div>
                  <div className="text-xs text-gray-400">{crypto.name}</div>
                  {crypto.rate && (
                    <div className="text-xs text-green-400">${crypto.rate}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Estimate Display */}
          {amount && selectedCoin && cryptoAmount && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white/10 rounded-xl p-4 mb-6"
            >
              <h4 className="text-white font-semibold mb-3">Payment Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">USD Amount:</span>
                  <span className="text-white font-semibold">${amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Crypto Amount:</span>
                  <span className="text-white font-semibold">{cryptoAmount} {selectedCoin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Points to Earn:</span>
                  <span className="text-green-400 font-semibold">{getPointsForAmount(amount)} pts</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Generate QR Button */}
          <button
            onClick={handleGenerateQR}
            disabled={!amount || !selectedCoin || parseFloat(amount) < 50 || (!cryptoAmount && !walletAddress)}
            className={`mobile-button font-semibold transition-all duration-300 touch-target ${
              !amount || !selectedCoin || parseFloat(amount) < 50 || (!cryptoAmount && !walletAddress)
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white'
            }`}
          >
            View estimate and wallet address (QR Code)
          </button>
        </motion.div>

        {/* Standalone Submit Proof Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mt-6"
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <CheckCircle className="w-6 h-6 mr-2" />
            Submit Proof of Payment
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white font-semibold mb-2">Upload Receipt (PNG/JPG/PDF)</label>
              <input
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                onChange={handleReceiptChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
              {receiptFile && (
                <div className="mt-2 text-xs text-gray-300">
                  Selected: <span className="text-purple-300">{receiptFile.name}</span>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-white font-semibold mb-2">Transaction Hash (optional)</label>
              <input
                type="text"
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
                placeholder="Paste transaction hash"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
            </div>
            
            <button
              onClick={handleSubmitProof}
              disabled={isSubmitting || !receiptFile}
              className={`mobile-button font-semibold transition-all duration-300 ${
                isSubmitting || !receiptFile
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Proof'}
            </button>
          </div>
        </motion.div>

        {/* QR Code Section */}
        {showQR && walletAddress && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-effect rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <QrCode className="w-6 h-6 mr-2" />
              Payment Information
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* QR Code Placeholder */}
              <div className="text-center">
                <div className="bg-white rounded-xl p-8 mb-4 inline-block">
                  <div className="w-48 h-48 bg-black flex items-center justify-center">
                    <div className="text-white text-xs text-center">
                      <QrCode className="w-16 h-16 mx-auto mb-2" />
                      <div>QR Code</div>
                      <div className="text-xs mt-2 break-all">
                        {generateQRCodeData().substring(0, 30)}...
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  Scan this QR code with your wallet app
                </p>
              </div>

              {/* Wallet Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Wallet Address
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="bg-black/30 px-3 py-2 rounded text-purple-300 font-mono text-sm flex-1 break-all">
                      {walletAddress}
                    </code>
                    <button
                      onClick={copyWalletAddress}
                      className="p-2 bg-purple-500 hover:bg-purple-600 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Amount to Send
                  </label>
                  <div className="bg-black/30 px-3 py-2 rounded text-green-400 font-mono text-lg">
                    {cryptoAmount} {selectedCoin}
                  </div>
                </div>

                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" />
                    <div className="text-sm text-yellow-100">
                      <p className="font-semibold mb-1">Important:</p>
                      <p>Send exactly {cryptoAmount} {selectedCoin} to the address above. 
                      Your points will be credited after payment confirmation.</p>
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Contributions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20"
        >
          <div className="flex items-center justify-center sm:justify-start mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" />
              Recent Contributions
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {recentContributions.map((contribution, index) => (
              <motion.div
                key={contribution.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10 hover:bg-white/10 transition-all duration-200"
              >
                {/* Mobile Layout (< sm) */}
                <div className="block sm:hidden space-y-3">
                  {/* User Info Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {contribution.user.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">@{contribution.user}</div>
                        <div className="text-xs text-gray-300">
                          {new Date(contribution.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        contribution.status === 'verified' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : contribution.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : contribution.status === 'under_review'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {contribution.status.replace('_', ' ').charAt(0).toUpperCase() + contribution.status.replace('_', ' ').slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Amount and Points Row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white text-sm">
                        {contribution.amount} {contribution.currency}
                      </div>
                      <div className="text-xs text-gray-300">
                        ${contribution.usdValue.toFixed(2)} USD
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-400">
                        {contribution.pointsAwarded}
                      </div>
                      <div className="text-xs text-gray-400">points</div>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout (>= sm) */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                      {contribution.user.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white truncate">@{contribution.user}</div>
                      <div className="text-sm text-gray-300">
                        {new Date(contribution.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 mx-4">
                    <div className="font-medium text-white">
                      {contribution.amount} {contribution.currency}
                    </div>
                    <div className="text-sm text-gray-300">
                      ${contribution.usdValue.toFixed(2)} USD
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-400">
                        {contribution.pointsAwarded}
                      </div>
                      <div className="text-xs text-gray-400">points</div>
                    </div>
                    
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                        contribution.status === 'verified' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : contribution.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : contribution.status === 'under_review'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {contribution.status.replace('_', ' ').charAt(0).toUpperCase() + contribution.status.replace('_', ' ').slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-gray-400 text-xs sm:text-sm">
              Showing recent community contributions • Updates in real-time
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contribute;