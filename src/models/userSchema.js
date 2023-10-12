const mongoose = require('mongoose');

const ilostuserSchema = new mongoose.Schema({
    emailAddress: { type: String, required: true },
    password: { type: String, required: true },
  });
  
  module.exports = mongoose.model('Ilostuser', ilostuserSchema);