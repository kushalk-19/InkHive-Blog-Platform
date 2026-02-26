const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  feedbackID: {
    type: Number,
    unique: true,
  },
  feedbackDescription: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 200,
    trim: true
  },
  userID: {
    type: Number,
    required: true
  },
  feedbackDate: {
    type: Date,
    default: Date.now
  }
});

// Auto-increment feedbackID
feedbackSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastFeedback = await this.constructor.findOne().sort({ feedbackID: -1 });
    this.feedbackID = lastFeedback ? lastFeedback.feedbackID + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('Feedback', feedbackSchema);