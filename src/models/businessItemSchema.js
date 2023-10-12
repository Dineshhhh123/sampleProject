const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  itemName: { type: String, required: true },
  itemCategory: { type: String, required: true },
  itemDescription: { type: String, required: true },
  keywords: { type: String, required: true },
  location: { type: String, required: true },
  locationIdentifiers: { type: String, required: true },
  businessName: { type: String, required: true },
  businessPhoneNumber: { type: Number, required: true },
  businessEmail: { type: String, required: true }
});

module.exports = mongoose.model('Item', itemSchema); 