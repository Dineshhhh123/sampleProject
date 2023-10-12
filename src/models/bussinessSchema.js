const mongoose = require('mongoose');

const bussinessSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobileName: { type: String, required: true },
    email: { type: String, required: true },
    companyName: { type: String, required: true },
    companyCategory: { type: String, required: true },
    password: { type: String, required: true },

  });
  
  module.exports = mongoose.model('Business', bussinessSchema);