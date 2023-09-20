const mongoose = require('mongoose');

const categoryOfferSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  categoryname: { type: String, required: true },
  discount: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
});

module.exports  = mongoose.model('categoryOffer', categoryOfferSchema);


