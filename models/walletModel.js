const mongoose=require('mongoose')

const walletSchema= new mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    balance:{
        type:Number,     
        default:0
    },
    transactions: [
        {
            date: {
                type: Date,
                default: Date.now
            },
            type: {
                type: String, // You can specify the type as 'debit' or 'credit' or any other relevant types
                default: false
            },
            amount: {
                type: Number,
                default: false
            }
        }
    ]
})

module.exports = mongoose.model('Wallet',walletSchema)

 