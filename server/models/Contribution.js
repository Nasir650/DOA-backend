const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  coin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coin',
    required: [true, 'Coin is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    trim: true
  },
  transactionHash: {
    type: String,
    trim: true,
    sparse: true // Allows multiple null values but unique non-null values
  },
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required'],
    trim: true
  },
  receipt: {
    filename: {
      type: String,
      required: [true, 'Receipt filename is required']
    },
    originalName: {
      type: String,
      required: [true, 'Original filename is required']
    },
    mimetype: {
      type: String,
      required: [true, 'File mimetype is required']
    },
    size: {
      type: Number,
      required: [true, 'File size is required']
    },
    path: {
      type: String,
      required: [true, 'File path is required']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  pointsAwarded: {
    type: Number,
    default: 0,
    min: 0
  },
  conversionRate: {
    type: Number,
    required: [true, 'Conversion rate is required'],
    min: [0, 'Conversion rate must be positive']
  },
  notes: {
    user: {
      type: String,
      trim: true,
      maxlength: [500, 'User notes cannot exceed 500 characters']
    },
    admin: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
    }
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  metadata: {
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    submissionSource: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    }
  },
  history: [{
    action: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected', 'updated'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'History notes cannot exceed 500 characters']
    },
    previousStatus: String,
    newStatus: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for calculated points based on amount and conversion rate
contributionSchema.virtual('calculatedPoints').get(function() {
  return Math.floor(this.amount * this.conversionRate);
});

// Virtual for processing time
contributionSchema.virtual('processingTime').get(function() {
  if (!this.reviewedAt) return null;
  return this.reviewedAt - this.createdAt;
});

// Virtual for status display
contributionSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'pending': 'Pending Review',
    'under_review': 'Under Review',
    'approved': 'Approved',
    'rejected': 'Rejected'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for is pending
contributionSchema.virtual('isPending').get(function() {
  return this.status === 'pending' || this.status === 'under_review';
});

// Virtual for is processed
contributionSchema.virtual('isProcessed').get(function() {
  return this.status === 'approved' || this.status === 'rejected';
});

// Indexes for better performance
contributionSchema.index({ user: 1, status: 1 });
contributionSchema.index({ coin: 1, status: 1 });
contributionSchema.index({ status: 1, createdAt: -1 });
contributionSchema.index({ reviewedBy: 1 });
contributionSchema.index({ transactionHash: 1 }, { sparse: true });
contributionSchema.index({ createdAt: -1 });

// Pre-save middleware to add history entry
contributionSchema.pre('save', function(next) {
  // If status is being modified, add to history
  if (this.isModified('status') && !this.isNew) {
    const historyEntry = {
      action: this.status === 'approved' ? 'approved' : 
              this.status === 'rejected' ? 'rejected' : 
              this.status === 'under_review' ? 'under_review' : 'updated',
      performedBy: this.reviewedBy || this.user,
      timestamp: new Date(),
      previousStatus: this.constructor.findOne({ _id: this._id }).status,
      newStatus: this.status
    };
    
    this.history.push(historyEntry);
  }

  // Set review timestamps
  if (this.isModified('status')) {
    if (this.status === 'approved' && !this.approvedAt) {
      this.approvedAt = new Date();
      this.reviewedAt = new Date();
    } else if (this.status === 'rejected' && !this.rejectedAt) {
      this.rejectedAt = new Date();
      this.reviewedAt = new Date();
    } else if (this.status === 'under_review' && !this.reviewedAt) {
      this.reviewedAt = new Date();
    }
  }

  next();
});

// Instance method to approve contribution
contributionSchema.methods.approve = async function(adminId, adminNotes = '') {
  try {
    this.status = 'approved';
    this.reviewedBy = adminId;
    this.reviewedAt = new Date();
    this.approvedAt = new Date();
    this.pointsAwarded = this.calculatedPoints;
    
    if (adminNotes) {
      this.notes.admin = adminNotes;
    }

    // Add to history
    this.history.push({
      action: 'approved',
      performedBy: adminId,
      timestamp: new Date(),
      notes: adminNotes,
      previousStatus: 'pending',
      newStatus: 'approved'
    });

    await this.save();

    // Award points to user
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(
      this.user,
      { 
        $inc: { 
          'points.total': this.pointsAwarded,
          'points.contributions': this.pointsAwarded,
          'stats.totalContributions': 1,
          'stats.approvedContributions': 1
        }
      }
    );

    return this;
  } catch (error) {
    throw error;
  }
};

// Instance method to reject contribution
contributionSchema.methods.reject = async function(adminId, adminNotes = '') {
  try {
    this.status = 'rejected';
    this.reviewedBy = adminId;
    this.reviewedAt = new Date();
    this.rejectedAt = new Date();
    
    if (adminNotes) {
      this.notes.admin = adminNotes;
    }

    // Add to history
    this.history.push({
      action: 'rejected',
      performedBy: adminId,
      timestamp: new Date(),
      notes: adminNotes,
      previousStatus: 'pending',
      newStatus: 'rejected'
    });

    await this.save();

    // Update user stats
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(
      this.user,
      { 
        $inc: { 
          'stats.totalContributions': 1,
          'stats.rejectedContributions': 1
        }
      }
    );

    return this;
  } catch (error) {
    throw error;
  }
};

// Instance method to put under review
contributionSchema.methods.putUnderReview = async function(adminId, adminNotes = '') {
  try {
    this.status = 'under_review';
    this.reviewedBy = adminId;
    this.reviewedAt = new Date();
    
    if (adminNotes) {
      this.notes.admin = adminNotes;
    }

    // Add to history
    this.history.push({
      action: 'under_review',
      performedBy: adminId,
      timestamp: new Date(),
      notes: adminNotes,
      previousStatus: 'pending',
      newStatus: 'under_review'
    });

    await this.save();
    return this;
  } catch (error) {
    throw error;
  }
};

// Static method to get contribution statistics
contributionSchema.statics.getContributionStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalPoints: { $sum: '$pointsAwarded' }
      }
    }
  ]);

  const result = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    under_review: 0,
    totalAmount: 0,
    totalPointsAwarded: 0
  };

  stats.forEach(stat => {
    result.total += stat.count;
    result.totalAmount += stat.totalAmount;
    result.totalPointsAwarded += stat.totalPoints;
    result[stat._id] = stat.count;
  });

  return result;
};

// Static method to get pending contributions
contributionSchema.statics.getPendingContributions = function() {
  return this.find({ 
    status: { $in: ['pending', 'under_review'] } 
  })
  .populate('user', 'firstName lastName email')
  .populate('coin', 'name symbol')
  .sort({ createdAt: -1 });
};

// Static method to get user contributions
contributionSchema.statics.getUserContributions = function(userId, status = null) {
  const query = { user: userId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('coin', 'name symbol logo')
    .sort({ createdAt: -1 });
};

// Static method to get contributions by date range
contributionSchema.statics.getContributionsByDateRange = function(startDate, endDate, status = null) {
  const query = {
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('user', 'firstName lastName email')
    .populate('coin', 'name symbol')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Contribution', contributionSchema);