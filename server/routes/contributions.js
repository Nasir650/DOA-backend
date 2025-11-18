const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Contribution = require('../models/Contribution');
const Coin = require('../models/Coin');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const receiptsDir = path.join(__dirname, '..', 'uploads', 'receipts');
fs.mkdirSync(receiptsDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, receiptsDir);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + safeName);
  }
});

// File filter: allow images and PDFs
const fileFilter = (req, file, cb) => {
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPG, and PDF allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// POST /api/contributions/upload
router.post('/upload', auth, upload.single('receipt'), async (req, res) => {
  try {
    const { amount, currency, walletAddress, transactionHash } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Receipt file is required' });
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount < 50) {
      return res.status(400).json({ success: false, message: 'Amount must be at least $50' });
    }

    if (!currency) {
      return res.status(400).json({ success: false, message: 'Currency is required' });
    }

    if (!walletAddress) {
      return res.status(400).json({ success: false, message: 'Wallet address is required' });
    }

    // Normalize symbol (e.g., USDT-TRC20 -> USDT-TRC20 as-is)
    const symbol = String(currency).trim().toUpperCase();

    // Find or create coin entry
    let coin = await Coin.findOne({ symbol });
    if (!coin) {
      coin = new Coin({
        name: symbol,
        symbol,
        isActive: true,
        walletInfo: { address: walletAddress, network: 'Unknown' },
        createdBy: req.user.id
      });
      await coin.save();
    }

    const receiptRelativePath = path.posix.join('/uploads/receipts', req.file.filename);

    const contribution = new Contribution({
      user: req.user.id,
      coin: coin._id,
      amount: parsedAmount,
      currency: symbol,
      transactionHash: transactionHash || undefined,
      walletAddress,
      receipt: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: receiptRelativePath,
        uploadedAt: new Date()
      },
      status: 'pending',
      conversionRate: 1, // You can update based on Coin model later
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        submissionSource: 'web'
      },
      history: [{
        action: 'submitted',
        performedBy: req.user.id,
        timestamp: new Date(),
        notes: 'Contribution submitted with receipt',
        previousStatus: null,
        newStatus: 'pending'
      }]
    });

    await contribution.save();

    res.status(201).json({ success: true, message: 'Contribution proof submitted', contribution });
  } catch (err) {
    console.error('Upload contribution error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// GET /api/contributions/mine
router.get('/mine', auth, async (req, res) => {
  try {
    const contributions = await Contribution.getUserContributions(req.user.id);
    res.json({ success: true, contributions });
  } catch (err) {
    console.error('Fetch user contributions error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;