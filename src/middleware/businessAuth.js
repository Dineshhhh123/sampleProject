const jwt = require('jsonwebtoken');
require('dotenv').config();


exports.authorizeBusiness = (req, res, next) => {
    const token = req.headers["authorization"];
  
    if (!token) {
      return res.status(401).json({ message: 'Authentication failed: Token missing' });
    }
  
    try {
      const decodedToken = jwt.verify(token, process.env.BUSINESS_KEY);
  
      
  
      if (!decodedToken.businessId) {
        return res.status(403).json({ message: 'Authorization failed: Business access required' });
      }
  
      req.businessId = decodedToken.businessId;
      console.log(req.businessId)
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Authentication failed: Invalid token' });
    }
  };