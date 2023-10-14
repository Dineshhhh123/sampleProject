const mongoose = require("mongoose");
const { Schema } = mongoose;

module.exports = new Schema(
  {
    configName: {
      type: String,
      required: true,
    },
    configList: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
