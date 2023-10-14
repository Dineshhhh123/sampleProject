const { statusCodes, thirdpartyConfig } = require("./../configs");
const userService = require(`../services/mongo/user.service`);
const jwt = require("jsonwebtoken");
const unAuthorizedResponse = {
  status: statusCodes.HTTP_UNAUTHORIZED,
  message: "unauthorized.",
};

const tokenExpiredResponse = {
  status : statusCodes.HTTP_UNAUTHORIZED,
  message: "Token expired."
}

const invalidTokenResponse = {
  status : statusCodes.HTTP_UNAUTHORIZED,
  message: "Invalid token."
}

const sessionExpiredResponse = {
  status : statusCodes.HTTP_UNAUTHORIZED,
  message: "Session expired."
}
module.exports = {
  validateToken: async (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      if (!token) {
        next(invalidTokenResponse);
      }

      jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
          // update session inactive or DELETE by accessToken
          if(err.name == "TokenExpiredError"){
          userService.updateSessionDELETED(token);
            next(tokenExpiredResponse);
          }else if(err.name == "JsonWebTokenError" && err.message == "jwt must be provided"){
            next(invalidTokenResponse);
          }else{
            next(unAuthorizedResponse);
          }
         
        }
        req.user = user;
        if (user?.skipSession) {
          next(unAuthorizedResponse);
        }

        if (!user?.sessionId) {
          next(unAuthorizedResponse);
        }

        const getSessionData = await userService.getSessionData(
          user?.sessionId
        );

        if (!getSessionData){ next(sessionExpiredResponse);}
        next();
      });
    } catch (err) {
      console.log("error msgs", err.message);
      next(unAuthorizedResponse);
    }
  },
  verifyToken: async (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      if (!token) {
        return res.status(200).send({isValid:false})
      }

      jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
         return res.status(200).send({isValid:false})
        }
        req.user = user;
        if (user?.skipSession) {
         return res.status(200).send({isValid:false})
        }

        if (!user?.sessionId) {
         return res.status(200).send({isValid:false})
        }

        const getSessionData = await userService.getSessionData(
          user?.sessionId
        );

        if (!getSessionData){ 
         return res.status(200).send({isValid:false})
          }
         return res.status(200).send({isValid:true})
      });
    } catch (err) {
      next({
        status: statusCodes.HTTP_INTERNAL_SERVER_ERROR,
        message: messages["500"]
      })
    }
  },
  validateTokenResetToken: async (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      if (!token) {
        next(unAuthorizedResponse);
      }

      jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
          next(unAuthorizedResponse);
        }
        if (!user?.skipSession) {
          next(unAuthorizedResponse);
        }
        req.user = user;
        next();
        // }
      });
    } catch (err) {
      console.log("error msgs", err.message);
      next(unAuthorizedResponse);
    }
  },
};
