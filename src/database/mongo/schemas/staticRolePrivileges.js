'use strict';

const mongoose = require("mongoose");
const { Schema } = mongoose;



module.exports = new Schema({
  role: {
    type: String,
    trim: true,
    index: true,
    required:true
  },
  currentAdmins: {
    type: [String],
  },
  privilege: {
    type: mongoose.Schema.Types.Mixed
  }
  
},
);