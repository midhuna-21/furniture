const mongoose = require('mongoose');

const productOfferSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String,required: true},
  discount: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
});

module.exports  = mongoose.model('productOffer', productOfferSchema);


