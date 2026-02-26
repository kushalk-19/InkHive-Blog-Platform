const jwt = require('jsonwebtoken');
const User = require('../models/User'); // ← ADD THIS

module.exports = async (req, res, next) => {
  const token = req.cookies.userJWTToken; // ← YOUR COOKIE NAME
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { userID: 1, role: "user" }

    const user = await User.findOne({ userID: decoded.userID });
    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }

    req.user = user; // ← FULL USER OBJECT
    next();
  } catch (err) {
    console.error('Token error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};