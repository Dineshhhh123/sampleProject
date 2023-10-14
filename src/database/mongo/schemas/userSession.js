"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

module.exports = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
    trim: true,
    index: true,
  },
  status: {
    type: String,
    trim: true,
    required: true,
    index: true,
  },
  userType: {
    type: String,
    trim: true,
  },
  accessToken: {
    type: String,
    trim: true,
  },
  loginDateTime: {
    type: Date,
    required: true,
    default: new Date(),
  },
  firstLogin: {
    type: Number,
    required: true,
    default : 0
  }
});


