"use strict";

const { statusCodes } = require("../configs");
const { userSession } = require("../database/mongo/models");
const unAuthorizedResponse = {
  status: statusCodes.HTTP_UNAUTHORIZED,
  message: "unauthorized",
};
module.exports = {
  validateSession: async (req, res, next) => {
    try {
      const { sessionId } = req.user;
      const sessionFindResult = await userSession.findById(sessionId);

      if (!sessionFindResult || sessionFindResult.isActive == false) {
        next(unAuthorizedResponse);
      }

      next();
    } catch (err) {
      let unAuthorizedResponse = {
        status: statusCodes.HTTP_UNAUTHORIZED,
        message: "unauthorized",
      };
      console.log("error msgs", err);
      next(unAuthorizedResponse);
    }
  },
};
