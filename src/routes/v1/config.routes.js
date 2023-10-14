const express = require("express");
const { configController } = require("../../controllers");
const ConfigRoutes = express.Router();
const Joi = require("joi");
let validator = require("express-joi-validation").createValidator({
    passError: true
  });

const configValidator = Joi.object({
    configs: Joi.array().required(),
  });
  

ConfigRoutes.get("/:configName", configController.getConfig);
ConfigRoutes.post("/", validator.body(configValidator), configController.getConfigWithCondition);

module.exports = ConfigRoutes;
