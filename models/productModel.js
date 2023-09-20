const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productname:{
        type:String,
        required:true 
    },
    categoryname:{
        type:String,
        required:true
    },
    description:{
        type:[String],
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    color:{
        type:String,
        required:true
    },
    image:{
        type:Array,
        required:true
    },
    productprice:{
        type:Number,
        required:true
    },
    salesprice:{
        type:Number,
        required:true
    },
    date:{
        type:Date,
        default: Date.now()
    },
    isListed:{
        type:Boolean,
        default: false
    }
})

module.exports = mongoose.model('Product',productSchema)