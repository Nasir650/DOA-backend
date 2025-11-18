import React, { useState, useEffect } from 'react';
import { getReceipts as dsGetReceipts, updateReceipt as dsUpdateReceipt, getUsersMap as dsGetUsersMap } from '../../../utils/datastore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt,
  Search,
  Filter,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Copy,
  Calendar,
  DollarSign,
  Hash,
  User,
  FileText,
  Image,
  RefreshCw,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const ContributionReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReceipts();
    // Auto-refresh when datastore broadcasts updates
    const onUpdate = () => loadReceipts();
    window.addEventListener('datastore:update', onUpdate);
    return () => window.removeEventListener('datastore:update', onUpdate);
  }, []);

  useEffect(() => {
    filterReceipts();
  }, [receipts, searchTerm, statusFilter, dateFilter]);

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const raw = dsGetReceipts();
      const users = dsGetUsersMap();
      const mapped = raw.map((r) => {
        const user = users[r.userEmail] || {};
        return {
          id: r.id,
          userId: user.id || r.userEmail,
          username: (user.email || r.userEmail || '').split('@')[0],
          fullName: user.name || r.userEmail,
          email: r.userEmail,
          transactionId: r.url || r.notes || 'n/a',
          amount: r.amount || 0,
          currency: r.currency || 'USD',
          usdValue: r.amount || 0,
          status: r.status || (r.verified ? 'verified' : 'pending'),
          submittedAt: new Date(r.time).toISOString(),
          verifiedAt: r.verified ? new Date(r.time).toISOString() : null,
          verifiedBy: r.verified ? 'admin' : null,
          receiptImage: '',
          blockchainNetwork: '',
          blockNumber: null,
          gasUsed: null,
          notes: r.notes || '',
          pointsAwarded: r.verified ? Math.floor(r.amount || 0) : 0,
        };
      });
      setReceipts(mapped);
    } finally {
      setLoading(false);
    }
  };

  const filterReceipts = () => {
    let filtered = receipts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(receipt =>
        receipt.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(receipt => receipt.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      
      if (dateFilter !== 'all') {
        filtered = filtered.filter(receipt => 
          new Date(receipt.submittedAt) >= filterDate
        );
      }
    }

    setFilteredReceipts(filtered);
  };

  const handleStatusUpdate = (receiptId, newStatus) => {
    const verified = newStatus === 'verified' || newStatus === 'accepted';
    const updated = dsUpdateReceipt(receiptId, { status: newStatus, verified });
    if (!updated) {
      toast.error('Failed to update receipt');
      return;
    }
    setReceipts((prev) => prev.map((r) => r.id === receiptId ? {
      ...r,
      status: newStatus,
      verifiedAt: verified ? new Date().toISOString() : null,
      verifiedBy: verified ? 'admin' : null,
      pointsAwarded: verified ? Math.floor(r.usdValue || r.amount || 0) : 0,
    } : r));
    const label = newStatus === 'accepted' ? 'accepted' : (newStatus === 'verified' ? 'verified' : 'rejected');
    toast.success(`Receipt ${label} successfully`);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'under_review': return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTransactionId = (txId) => {
    if (txId.length > 20) {
      return `${txId.substring(0, 10)}...${txId.substring(txId.length - 10)}`;
    }
    return txId;
  };

  const exportReceipts = () => {
    const csvContent = [
      ['ID', 'User', 'Transaction ID', 'Amount', 'Currency', 'USD Value', 'Status', 'Submitted', 'Verified', 'Points Awarded'],
      ...filteredReceipts.map(receipt => [
        receipt.id,
        receipt.username,
        receipt.transactionId,
        receipt.amount,
        receipt.currency,
        receipt.usdValue,
        receipt.status,
        new Date(receipt.submittedAt).toLocaleDateString(),
        receipt.verifiedAt ? new Date(receipt.verifiedAt).toLocaleDateString() : '',
        receipt.pointsAwarded
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contribution-receipts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Receipts exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contribution Receipts</h2>
          <p className="text-gray-600 mt-1">View and verify user contribution receipts and transaction IDs</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={loadReceipts}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
          <motion.button
            onClick={exportReceipts}
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
            placeholder="Search by user, transaction ID, or email..."
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
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="accepted">Accepted</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReceipts.map((receipt, index) => (
                <motion.tr
                  key={receipt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {receipt.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{receipt.fullName}</div>
                        <div className="text-sm text-gray-500">@{receipt.username}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3 text-gray-400" />
                        <span className="font-mono text-sm text-gray-900">
                          {formatTransactionId(receipt.transactionId)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(receipt.transactionId)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        {receipt.blockchainNetwork}
                        {receipt.blockNumber && ` • Block ${receipt.blockNumber}`}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">
                        {receipt.amount} {receipt.currency}
                      </div>
                      <div className="text-sm text-gray-500">
                        ${receipt.usdValue.toFixed(2)} USD
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(receipt.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(receipt.status)}`}>
                        {receipt.status.replace('_', ' ').charAt(0).toUpperCase() + receipt.status.replace('_', ' ').slice(1)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <div className="text-gray-900">
                        {new Date(receipt.submittedAt).toLocaleDateString()}
                      </div>
                      <div className="text-gray-500">
                        {new Date(receipt.submittedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-center">
                      <span className="text-lg font-bold text-gray-900">
                        {receipt.pointsAwarded}
                      </span>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => {
                          setSelectedReceipt(receipt);
                          setShowReceiptModal(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>

                      {receipt.status === 'pending' && (
                        <>
                          <motion.button
                            onClick={() => handleStatusUpdate(receipt.id, 'accepted')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors duration-200"
                            title="Accept"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleStatusUpdate(receipt.id, 'verified')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200"
                            title="Verify"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleStatusUpdate(receipt.id, 'rejected')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </motion.button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReceipts.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No receipts found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Receipt Details Modal */}
      <AnimatePresence>
        {showReceiptModal && selectedReceipt && (
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
              className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Receipt Details</h3>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <Eye className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Receipt Info */}
                <div className="space-y-6">
                  {/* User Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">User Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedReceipt.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Username:</span>
                        <span className="font-medium">@{selectedReceipt.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedReceipt.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Transaction Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{formatTransactionId(selectedReceipt.transactionId)}</span>
                          <button
                            onClick={() => copyToClipboard(selectedReceipt.transactionId)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Network:</span>
                        <span className="font-medium">{selectedReceipt.blockchainNetwork}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">{selectedReceipt.amount} {selectedReceipt.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">USD Value:</span>
                        <span className="font-medium">${selectedReceipt.usdValue.toFixed(2)}</span>
                      </div>
                      {selectedReceipt.blockNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Block Number:</span>
                          <span className="font-medium">{selectedReceipt.blockNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Status Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedReceipt.status)}`}>
                          {selectedReceipt.status.replace('_', ' ').charAt(0).toUpperCase() + selectedReceipt.status.replace('_', ' ').slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Submitted:</span>
                        <span className="font-medium">{new Date(selectedReceipt.submittedAt).toLocaleString()}</span>
                      </div>
                      {selectedReceipt.verifiedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Verified:</span>
                          <span className="font-medium">{new Date(selectedReceipt.verifiedAt).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Points Awarded:</span>
                        <span className="font-medium">{selectedReceipt.pointsAwarded}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedReceipt.notes && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Notes</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {selectedReceipt.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {selectedReceipt.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedReceipt.id, 'accepted');
                          setShowReceiptModal(false);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedReceipt.id, 'verified');
                          setShowReceiptModal(false);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Verify
                      </button>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedReceipt.id, 'rejected');
                          setShowReceiptModal(false);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Receipt Image */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Receipt Image</h4>
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">Receipt image would be displayed here</p>
                    <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 mx-auto">
                      <Download className="w-4 h-4" />
                      Download Image
                    </button>
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

export default ContributionReceipts;