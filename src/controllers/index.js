"use strict";

const userController = require("./user.controller");
const configController = require("./config.controller");
module.exports = {
  userController,
  configController: configController,
};
