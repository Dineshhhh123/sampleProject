"use strict";

const mongoose = require("mongoose");
const { userSession: userSessionSchema } = require("../schemas");

module.exports = mongoose.model("userSessions", userSessionSchema);
