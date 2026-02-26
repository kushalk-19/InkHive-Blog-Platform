const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.cookies.adminJWTToken;

  if (!token) {
    return res.status(401).json({ msg: 'No admin token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded); // ← ADD THIS
    if (decoded.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied: Admin only' });
    }
    req.admin = decoded; // { adminID, role }
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ msg: 'Invalid admin token' });
  }
};