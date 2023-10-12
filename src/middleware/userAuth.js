const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.authenticateUser = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: 'Authentication failed: Token missing' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.USER_KEY);
    req.userId = decodedToken.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed: Invalid token' });
  }
};