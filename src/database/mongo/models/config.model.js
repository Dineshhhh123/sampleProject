"use strict";

const mongoose = require("mongoose");
const { config: configSchema } = require("../schemas");

module.exports = mongoose.model("configs", configSchema);
