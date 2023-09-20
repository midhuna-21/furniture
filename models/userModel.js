const mongoose  = require('mongoose');

const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    tel:{
        type:Number,
        required:true,
    },
    password:{
        type:String,
        required:true
    },
    is_admin:{
        type:Boolean,
        default: 0
    },
    is_verified: {
        type:Number,
        default: 0 
    },
    isActive:{
        type:Boolean,
        default:false
    },
    address: [
        {   name:{
              type:String,
              required:true
            },
            tel:{
                type:Number,
                required:true,
            },
            address: {
                type: String,
                required: true,
            },
            city: {
                type: String,
                required: true,
            },
            state: {
                type: String,
                required: true,
            },
            pincode: {
                type: Number,
                required: true,
            }
           
        }
    ]

})
module.exports = mongoose.model('users',userSchema)