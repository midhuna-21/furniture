const Product = require('../models/productModel');
const Wishlist = require('../models/wishlist')


const addToWishlist = async (req, res) => {
    try {
       
        const userId = req.session.user_id;
        const productId = req.params.productId; 
console.log('pri',productId)
        if (!req.session.user_id) {
            return res.json({ user: false });
        } else {
            let wishlist = await Wishlist.findOne({ user: userId });
            if (!wishlist) {
                wishlist = new Wishlist({
                    user: userId,
                    products: [],
                });
            }

            if (wishlist.products.some((item) => item.product.equals(productId))) {
                return res.status(400).json({ success: false, message: 'Product already in the wishlist' });
            }

          
            wishlist.products.push({ product: productId });
            console.log('sifsi',productId)
            await Product.updateOne({ _id: productId }, { isWishlist: true });
            await wishlist.save();
          console.log('sjfg')
            res.status(200).json({ success: true });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'An error occurred while adding the product to the wishlist' });
    }
};
const wishlists = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const wishlist = await Wishlist.findOne({ user: userId }).populate("products.product");
        console.log('whi',wishlist)
        res.render('users/wishlist', { wishlist });
    } catch (error) {
        console.error(error.message);
    }
}
const removeWishlist = async (req, res) => {
   
    try {
        const productIdToRemove = req.params.productId;
        const wishlist = await Wishlist.findOne({ user: req.session.user_id });
        if (!wishlist || !productIdToRemove) {
            return res.status(404).json({ error: 'Wishlist or product not found' });
        }

        wishlist.products = wishlist.products.filter(productObj => productObj.product.toString() !== productIdToRemove);
        await Product.updateOne({ _id: productIdToRemove }, { isWishlist: false });
        await wishlist.save();

        res.json({success: true})
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};
const removeWishlistFromWihslist = async (req, res) => {
  
     try {
         const productIdToRemove = req.params.productId;
         const wishlist = await Wishlist.findOne({ user: req.session.user_id });
         if (!wishlist || !productIdToRemove) {
             return res.status(404).json({ error: 'Wishlist or product not found' });
         }
 
         wishlist.products = wishlist.products.filter(productObj => productObj.product.toString() !== productIdToRemove);
         await Product.updateOne({ _id: productIdToRemove }, { isWishlist: false });
         await wishlist.save();
 
         res.redirect('/wishlist')
     } catch (error) {
         console.error(error.message);
         res.status(500).send('Internal Server Error');
     }
 };
module.exports = {
    addToWishlist,
    wishlists,
    removeWishlist,
    removeWishlistFromWihslist
}