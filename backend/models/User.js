const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema({
  userID: { type: Number, unique: true, sparse: true },
  userName: { type: String, minlength: 8, maxlength: 16, unique: true, required: true },
  firstName: { type: String, maxlength: 20 },
  lastName: { type: String, maxlength: 20 },
  userGender: { type: String, maxlength: 10 },
  userEmail: { type: String, maxlength: 30, unique: true, required: true },
  userContact: { type: String, match: /^[6-9]\d{9}$/},
  userImage: { type: String },
  userBio: { type: String, minlength: 10, maxlength: 250 },
  userPassword: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  adminID: { type: Number, unique: true, sparse: true }, // ← ADD THIS
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

// Validate email format
userSchema.path('userEmail').validate(function(value) {
  return emailRegex.test(value);
}, 'Invalid email format');

// Validate password length (before hashing)
userSchema.path('userPassword').validate(function(value) {
  return value.length >= 6 && value.length <= 14;
}, 'Password must be between 6 and 14 characters');

// Auto-increment userID using max query (simple, in one file)
userSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const lastUser = await this.constructor.findOne({}, { userID: 1 }, { sort: { userID: -1 } });
      this.userID = lastUser ? lastUser.userID + 1 : 1;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Hash password if modified
userSchema.pre('save', async function(next) {
  if (this.isModified('userPassword')) {
    this.userPassword = await bcrypt.hash(this.userPassword, 10);
  }
  next();
});

// Method to compare password during login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.userPassword);
};

module.exports = mongoose.model('User', userSchema);