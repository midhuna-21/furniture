const mongoose = require('mongoose');

const whishlistSchema  = new mongoose.Schema({
    user: {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [
        {
            product: {
                type:mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            }
        }
    ]
})

module.exports = mongoose.model('Whishlist', whishlistSchema);
