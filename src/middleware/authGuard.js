
const jwt = require("jsonwebtoken");
const userService = require(`../services/mongo/user.service`);
const { USER_ROLE_TYPE } = require("../constants");
const UserService = require("../services/mongo/user.service");
function authGuard (role){
   
        return async (req, res, next) => {
          // Get the JWT token from the request header
          const authHeader = req.headers["authorization"];
          const token = authHeader && authHeader.split(" ")[1];
      
          if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
          }
      
          try {
            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
            // Find the user in the database based on the decoded token (e.g., user ID)
            const user = await userService.getUserById(decoded.id);
      
            if (!user) {
              return res.status(401).json({ message: 'User not found.' });
            }
      
            // Check if the user's role matches the required role
            console.log(decoded.role, role);
            
            if (decoded.role !== role) {
              return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
            }
      
            // If the user's role is correct, store user information in the request object
            //req.user = user;
            next();
          } catch (error) {
            console.log(error)
            res.status(400).json({ message: 'Invalid token.' });
          }
        };
      
}

const animetaAccessCheck = async (req, res, next) =>{
    const role = req?.user.role;
    // companyId -> Top Level Id, who is hitting the request
    const companyIdReqFrom =  req?.user.id;
     // request for companyId -> example Get brands of other company
    let companyIdReqFor = (req.query && req.query.companyId) ? req.query.companyId : (req.body && req.body.companyId) ? req?.body.companyId : companyIdReqFrom;
    if(!companyIdReqFor){
      return res.status(400).json({ message: 'CompanyId is required.' });
    }
    let  reqForCompany = await UserService.getUserById(companyIdReqFor);
    reqForCompany = JSON.parse(JSON.stringify(reqForCompany));
    if(!reqForCompany  || !reqForCompany.data  ){
      return res.status(404).json({ message: 'Request account not found.' });
    }
    if(companyIdReqFrom !== companyIdReqFor && role !== USER_ROLE_TYPE.ANIMETA_ADMIN){
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    req.user.companyIdReqFrom = companyIdReqFrom;
    req.user.companyIdReqFor = companyIdReqFor;
    req.user.companyDomainReqFor = reqForCompany.data.companyMailId.split('@')[1];
    next();
}

module.exports = {
    authenticateRole: authGuard,
    animetaAccessCheck: animetaAccessCheck
}