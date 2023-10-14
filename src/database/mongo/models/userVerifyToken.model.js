"use strict";

const mongoose = require("mongoose");
const { userVerifyToken: verifyTokenSchema } = require("../schemas");

module.exports = mongoose.model("userverifytokens", verifyTokenSchema);
