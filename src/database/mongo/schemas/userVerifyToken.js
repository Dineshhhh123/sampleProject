"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

module.exports = new Schema({
  userid: {
    type: String,
    trim: true,
    index: true,
    required: true,
  },
  token: {
    type: String,
    trim: true,
    index: true,
    required: true,
  },
  startTime: {
    type: Date,
    default: new Date(),
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
});
