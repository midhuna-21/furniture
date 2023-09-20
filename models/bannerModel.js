const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image:{
    type:Array,
    required:true
},

  date: {
    type: Date,
    default: Date.now 
},
  expirationDate:  {
    type: Date,
    required:true
},
  isActive: { type: Boolean, default: false },
});

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
