'use strict';

const mongoose = require("mongoose");
const { USER_STATUS } = require("../../../constants");
const { Schema } = mongoose;



module.exports = new Schema({
  name: {
    type: String,
    trim: true,
    index: true,
    required:true
  },
  lastName: {
    type: String,
    trim: true
  },
  mobileNumber: {
    type: Number,
    required: true,
    trim: true,
    index: true
  },
  companyName: {
    type: String,
    trim: true,
    index: true,
    required:true
  },
  
  companyMailId: {
    type: String,
    trim: true,
    index: true,
    lowercase: true
  },
 
  countryCode: {
    type: String,
    trim: true
  },
  
  password: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    trim: true,
    default: USER_STATUS.INACTIVE
  },
  brandCount: {
    type: Number,
    default: 0
  },
  campaignCount: {
    type: Number,
    default: 0
  },
  campaignRequestCount:{
    type: Number,
    default:0
  }
  
}, {
  timestamps: true
});