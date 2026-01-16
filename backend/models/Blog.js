// backend/models/Blog.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  commentBy: { type: String, enum: ['admin', 'user'], required: true },
  adminID: { type: Number, default: null },
  userID: { type: Number, default: null },
  commentText: { type: String, required: true, maxlength: 100 },
  created_at: { type: Date, default: Date.now }
});

const blogSchema = new mongoose.Schema({
  blogID: { type: Number, unique: true },
  blogTitle: { type: String, required: true, minlength: 5, maxlength: 100 },
  blogDescription: { type: String, required: true, minlength: 100 },
  blogImage: { type: String },
  categoryID: { type: Number, required: true }, // ← NO ref
  blogBy: { type: String, enum: ['admin', 'user'], required: true },
  adminID: { type: Number, default: null },
  userID: { type: Number, default: null },
  blogStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
  //likes: [{ type: Number, default: [] }],
  likes: { type: [Number], default: [] },
  comments: [commentSchema]
});

// Auto-increment
blogSchema.pre('save', async function (next) {
  if (this.isNew) {
    const last = await this.constructor.findOne({}, { blogID: 1 }, { sort: { blogID: -1 } });
    this.blogID = last ? last.blogID + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);