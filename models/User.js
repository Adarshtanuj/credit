const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  credits: {
    type: Number,
    default: 10,
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true // ✅ This fixes the issue by allowing multiple nulls
  },
  referredBy: {
    type: String,
    default: null
  },
  usedCredits: [{
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('User', userSchema);
