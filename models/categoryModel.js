const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({

    categoryname:{
        type:String, 
        required:true,
        unique: true,
        lowercase:true
    },
    description:{
        type:[String],
        required:true
    },
    image:{
        type:String,
        required:true
    },
    isListed:{
        type:Boolean,
        default: false
    },
    createdAt:{
        type:Date,
        default: Date.now()
    }
})

module.exports = mongoose.model('category',categorySchema);