// backend/models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  categoryID: { type: Number, unique: true },
  categoryName: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 15,
    unique: true,
    trim: true,
  },
  categoryBy: {
    type: String,
    enum: ['admin', 'user'],
    required: true,
  },
  adminID: {
    type: Number,
    default: null,
  },
  userID: {
    type: Number,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Auto-increment categoryID
categorySchema.pre('save', async function (next) {
  if (this.isNew) {
    const last = await this.constructor.findOne({}, { categoryID: 1 }, { sort: { categoryID: -1 } });
    this.categoryID = last ? last.categoryID + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);