const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vote title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Vote description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  options: [{
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Option text cannot be more than 100 characters']
    },
    votes: {
      type: Number,
      default: 0,
      min: 0
    },
    voters: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  type: {
    type: String,
    enum: ['single', 'multiple', 'ranked'],
    default: 'single'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    allowMultipleVotes: {
      type: Boolean,
      default: false
    },
    requireLogin: {
      type: Boolean,
      default: true
    },
    showResults: {
      type: String,
      enum: ['always', 'after_vote', 'after_end'],
      default: 'after_vote'
    },
    maxVotesPerUser: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  totalVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  uniqueVoters: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  results: {
    winner: {
      optionId: String,
      text: String,
      votes: Number,
      percentage: Number
    },
    summary: {
      totalVotes: Number,
      totalVoters: Number,
      completionRate: Number
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for vote duration
voteSchema.virtual('duration').get(function() {
  return this.endDate - this.startDate;
});

// Virtual for time remaining
voteSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  if (now > this.endDate) return 0;
  return this.endDate - now;
});

// Virtual for is active
voteSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
});

// Virtual for is expired
voteSchema.virtual('isExpired').get(function() {
  const now = new Date();
  return now > this.endDate;
});

// Indexes for better performance
voteSchema.index({ status: 1, startDate: 1, endDate: 1 });
voteSchema.index({ createdBy: 1 });
voteSchema.index({ tags: 1 });
voteSchema.index({ createdAt: -1 });

// Pre-save middleware to validate dates
voteSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    return next(new Error('End date must be after start date'));
  }
  
  // Auto-update status based on dates
  const now = new Date();
  if (this.status === 'active') {
    if (now < this.startDate) {
      this.status = 'draft';
    } else if (now > this.endDate) {
      this.status = 'completed';
    }
  }
  
  next();
});

// Instance method to add vote
voteSchema.methods.addVote = async function(userId, optionIds) {
  try {
    // Validate if user can vote
    if (!this.canUserVote(userId)) {
      throw new Error('User cannot vote on this poll');
    }

    // Check if user already voted
    const hasVoted = this.options.some(option => 
      option.voters.some(voter => voter.user.toString() === userId.toString())
    );

    if (hasVoted && !this.settings.allowMultipleVotes) {
      throw new Error('User has already voted');
    }

    // Add votes
    let votesAdded = 0;
    for (const optionId of optionIds) {
      const option = this.options.find(opt => opt.id === optionId);
      if (option) {
        option.votes += 1;
        option.voters.push({
          user: userId,
          votedAt: new Date()
        });
        votesAdded++;
      }
    }

    // Update totals
    this.totalVotes += votesAdded;
    
    // Update unique voters count
    const allVoters = new Set();
    this.options.forEach(option => {
      option.voters.forEach(voter => {
        allVoters.add(voter.user.toString());
      });
    });
    this.uniqueVoters = allVoters.size;

    await this.save();
    return this;
  } catch (error) {
    throw error;
  }
};

// Instance method to check if user can vote
voteSchema.methods.canUserVote = function(userId) {
  const now = new Date();
  
  // Check if vote is active
  if (this.status !== 'active' || now < this.startDate || now > this.endDate) {
    return false;
  }

  // Check if user is allowed (for private votes)
  if (!this.isPublic && !this.allowedUsers.includes(userId)) {
    return false;
  }

  return true;
};

// Instance method to get user's vote
voteSchema.methods.getUserVote = function(userId) {
  const userVotes = [];
  this.options.forEach(option => {
    const userVote = option.voters.find(voter => 
      voter.user.toString() === userId.toString()
    );
    if (userVote) {
      userVotes.push({
        optionId: option.id,
        optionText: option.text,
        votedAt: userVote.votedAt
      });
    }
  });
  return userVotes;
};

// Instance method to calculate results
voteSchema.methods.calculateResults = function() {
  const totalVotes = this.totalVotes;
  
  if (totalVotes === 0) {
    this.results = {
      winner: null,
      summary: {
        totalVotes: 0,
        totalVoters: 0,
        completionRate: 0
      }
    };
    return this.results;
  }

  // Find winner
  const winner = this.options.reduce((prev, current) => 
    (prev.votes > current.votes) ? prev : current
  );

  this.results = {
    winner: {
      optionId: winner.id,
      text: winner.text,
      votes: winner.votes,
      percentage: Math.round((winner.votes / totalVotes) * 100)
    },
    summary: {
      totalVotes: this.totalVotes,
      totalVoters: this.uniqueVoters,
      completionRate: this.uniqueVoters > 0 ? Math.round((this.totalVotes / this.uniqueVoters) * 100) : 0
    }
  };

  return this.results;
};

// Static method to get active votes
voteSchema.statics.getActiveVotes = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
    isPublic: true
  }).populate('createdBy', 'firstName lastName email');
};

// Static method to get vote statistics
voteSchema.statics.getVoteStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalVotes: { $sum: '$totalVotes' }
      }
    }
  ]);

  const result = {
    total: 0,
    active: 0,
    completed: 0,
    draft: 0,
    totalVotes: 0
  };

  stats.forEach(stat => {
    result.total += stat.count;
    result.totalVotes += stat.totalVotes;
    result[stat._id] = stat.count;
  });

  return result;
};

module.exports = mongoose.model('Vote', voteSchema);