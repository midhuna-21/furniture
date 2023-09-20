const mongoose= require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'users'
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.ObjectId,
                ref: 'Product',
                required: true,
            },
            quantity:{
                type: Number,
                required: true,
                min: 1,
            },
            productprice: {
                type:Number,
                require: true,
                min: 0,
            },
        },
    ],
    orderStatus: {
		type: String,
		enum: ['Pending','Cancelled','Placed','Delivered'],
		default: 'Pending',
	},
	totalprice: {
		type: Number,
		required: true,
		min: 0,
	},
	paymentMethod: {
		type: String,
		required: true,
	},
    isPaid: {
		type: Boolean,
		default: false,
	},
    paymentData:{
        type: Object,
    },
    orderDate: {
        type: Date,
        default: Date.now 
    },
	address: {
        name:{
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
});
module.exports = mongoose.model('Order', orderSchema)
