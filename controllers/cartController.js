const mongoose = require('mongoose');
const session = require('express-session') 
const User = require('../models/userModel')
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Category = require('../models/productModel');
const Order = require('../models/orderModel')
const Coupon = require('../models/couponModel')
const Wallet = require('../models/walletModel')
const walletHelper = require('../helper/walletHelper')
const crypto = require('crypto');

const Razorpay = require('razorpay');
const instance = new Razorpay({ key_id: 'rzp_test_XLuQj8MFj0FaxS', key_secret: 'dl0Hy9nM5tIuqoqfIsNvWwas' });
let chekout = false;
const getCart = async(req, res)=>{
    console.log('keri')
    const productId = req.params.productId;
    try {
        console.log('productid',productId)
        const products = await Product.findById(productId).lean();
        res.render('users/cartPage', { products });
    } catch (error) {
        console.log(error.message);
        res.render('/error')
    }
} 


const populateProductDetails = async (cart) => {
    const populatedProducts = await Promise.all(cart.products.map(async (product) => {
        const productDetails = await Product.findById(product.product);
        return { ...product.toObject(), productDetails };
    }));

    const populatedCart = cart.toObject();
    populatedCart.products = populatedProducts;
    
    return populatedCart;
};
const shopCart = async (req, res) => {
    try {
       
        const category = await Category.find();
        const products = await Product.find();
        const userId = req.session.user_id;
        const cart = await Cart.findOne({ user: userId }).populate({ path: "products.product" });
       
        if (!cart) {
            const emptyCart = { products: [] };
            
            res.render("users/cartPage", { cart: emptyCart, category, products,  calculateTotalPrice: 0});
        } else {
         
            const populatedCart = await populateProductDetails(cart);
            let calculateTotalPrice = 0;
            for (const cartProduct of populatedCart.products) {
                const product = cartProduct.product;
                const cartQuantity = cartProduct.quantity;
                calculateTotalPrice += product.productprice * cartQuantity;
            }
            res.render("users/cartPage", { cart: populatedCart, category, products, calculateTotalPrice});
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('An error occurred while processing the cart.');
    }
};

const cartt = async(req, res)=>{
    try{
        console.log('fkxh')
       
        res.render("users/cart")        
    }catch(error){
        console.log(error.message)
    }
}
// add product to cart 
const addToCart = async (req, res) => {
    const userId = req.session.user_id;
    const { productId, quantity } = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({ success: false, message: 'Insufficient stock' });
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, products: [] });
        }
    
        const existingProduct = cart.products.find(cartProduct => cartProduct.product.equals(productId));
        if (existingProduct) {
            existingProduct.quantity += Number(quantity);
        } else {
            cart.products.push({ product: productId, quantity });
        }
        console.log('nadno')
        product.quantity -= quantity;
        console.log('set')
        await product.save();

        await cart.save();
        res.status(200).json({ success: true });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'An error occurred while adding the product to the cart' });
    }
};


const updateCart = async(req, res)=>{
    const userId = req.session.user_id
    const {productId, quantity} = req.body;
    try{
        const cart = await Cart.findOne({ user: userId});
        if(!cart){
            return res.status(404).json({ success:false,message: 'Cart not found'});
        }
        const existingProduct = cart.products.find(cartProduct =>cartProduct.product.equals(productId))
        if(!existingProduct) {
            return res.status(404).json({ success: false, message: 'Product not found'})
        } 
        existingProduct.quantity = quantity;
        await cart.save()
        res.status(200).json({ success: true, message: 'Cart updated successfully'})
    }catch(error){
        console.log(error.message)
        res.status(500).json({ success: false, message: 'An error occured while updating the cart'})
    }
}


const checkout = async (req, res) => {
    try {
        const selectedCouponCode = req.query.couponCode;

        const userId = req.session.user_id;
        const user = await User.findById(userId);

        // Retrieve the user's wallet balance from your database (assuming you have a Wallet model)
        

        // Fetch the cart object
        const cart = await Cart.findOne({ user: userId }).populate('products.product');

        let calculateTotalPrice = 0;
        let discountAmount = 0; // Initialize discountAmount to 0

        // Define and initialize coupon and coupons variables
        let coupon = null;
       
        if (selectedCouponCode) {
          
            const selectedCoupon = await Coupon.findOne({ code: selectedCouponCode });
        
            if (selectedCoupon) {
                discountAmount = selectedCoupon.discountAmount;
                coupon = selectedCoupon; // Assign the selected coupon to the coupon variable
            } else {
                console.log('Selected coupon not found');
            }
        }

        // Calculate the total price with the coupon discount applied
        calculateTotalPrice -= discountAmount;

        if (cart) {
            for (const cartProduct of cart.products) {
                const product = cartProduct.product;
                const cartQuantity = cartProduct.quantity;
                calculateTotalPrice += product.productprice * cartQuantity; // Add product prices
            }
        }    const coupons = await Coupon.find()
        const wallet = await Wallet.findOne({ userId: userId });
        res.render('users/checkout', { user, cart, calculateTotalPrice, coupon, wallet, coupons });

    } catch (error) {
        console.log(error.message);
        res.status(500).send('An error occurred while processing the checkout.');
    }
};



const applyCoupon = async (req, res) => {
    try {
        if (req.session.user_id) {
            const { selectedCoupon } = req.body;
            const coupon = await Coupon.findById(selectedCoupon);
            if (coupon) {
                if (!coupon.usedBy || !coupon.usedBy.includes(req.session.userId)) {
                    if (!coupon.usedBy) {
                        coupon.usedBy = [];
                    }
                    coupon.usedBy.push(req.session.userId);
                    req.session.selectedCoupon = selectedCoupon;
                    console.log('pppppp')
                    await coupon.save();
                    res.redirect('/checkout?couponCode=' + encodeURIComponent(coupon.code));
                } else {
                    res.status(400).json({ error: 'Coupon already used by this user' });
                }
            } else {
                console.log('Coupon not found in database'); 
                res.status(404).json({ error: 'Coupon not found' });
            }
        } else {
            res.status(401).json({ error: 'User not logged in' });
        }
    } catch (error) {
        console.log(error.message);
    }
};


const checkBalance = async(req, res)=>{
    try{
        const userId = req.session.user_id;
        const wallet = await Wallet.findOne({ userId: userId });
        res.json({walletBalance: wallet.balance})
    }catch(error){
        console.log(error.message)
    }
}
const addAddressToCheckout = async(req, res)=>{
    console.log('address')
    try{
        const userId = req.session.user_id
        console.log('address UseriD')
        const {name,address,city,state,pincode,tel} = req.body;
        console.log('credentials to add address')
        const user = await User.findByIdAndUpdate(
            userId,
         
            {
                $push: {
                    address: {
                        name: name,
                        address: address,
                        city: city,
                        state: state,
                        pincode: pincode,
                        tel: tel,
                    },
                },
            },
            
            { new: true }
            
        );
       
        const addedAddress = user.address[user.address.length - 1]; 
        
        const referer = req.header('Referer');
        if (referer && referer.includes('/checkout')) {
            res.redirect('/checkout');
        } else {
            res.redirect('/profile');
        }
    }catch(error){
        console.log(error.message)
    }
}

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const cart = await Cart.findOne({ user: userId }).populate('products.product');
        const user = await User.findById(userId);
        const { paymentMethod } = req.body; // Include the useWallet option

        if (user && user.address && cart) {
            const address = user.address.id(req.body.addressId);

            let calculateTotalPrice = 0;
            for (const item of cart.products) {
                const product = await Product.findById(item.product._id);
                if (product) {
                    calculateTotalPrice += product.productprice * item.quantity;
                }
            }
            
            

            const newOrder = new Order({
                user: userId,
                products: cart.products.map((item) => ({
                    productId: item.product._id,
                    quantity: item.quantity,
                })),
                address: address,
                totalprice: calculateTotalPrice, // Use the updated calculateTotalPrice
                paymentMethod: paymentMethod,
            });

            console.log('order saving processing..');
            const savedOrder = await newOrder.save();
            if (paymentMethod === 'wallet') {
                console.log('hrfgh')
                const wallet = await Wallet.findOne({ userId: userId });
                
                if (wallet && wallet.balance > 0) {
                    const minimumWalletBalance = 1;
                    calculateTotalPrice -=  wallet.balance;
                    calculateTotalPrice = Math.max(calculateTotalPrice,minimumWalletBalance);           
                }
                cart.products = [];
                await cart.save();
                const updateResult = await walletHelper.updateWalletBalance(userId, -wallet.balance);
                console.log('gig')
                res.json({ calculateTotalPrice, method: 'wallet' });
            }
            else if (paymentMethod === 'cod') {
                cart.products = [];
                await cart.save();
                res.status(200).json({ method: 'cod' });
            } else if (paymentMethod === 'online') {
                const generateOrder = await generateOrderRazorpay(
                    savedOrder._id,
                    calculateTotalPrice
                );
                console.log('Generate order : ', generateOrder);
                console.log('place order fully working');
                cart.products = [];
                await cart.save();
                res.json({ generateOrder, method: 'online' });
            }
        } else {
            console.log(error.message);
            res.status(400).json({ error: 'User address or cart not found' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const generateOrderRazorpay = (orderId, total) => {
    return new Promise((resolve, reject) => {
        const options = {
            amount: total * 100,  
            currency: "INR",
            receipt: String(orderId)
        };
        instance.orders.create(options, function (err, order) {
            if (err) {
                console.log("failed");
                console.log(err);
                reject(err);
            } else {
                console.log("Order Generated RazorPAY: " + JSON.stringify(order));
                resolve(order);
            }
        });
    })
}

const verifyOrderPayment = (details) => {
    console.log("DETAILS : " + JSON.stringify(details));
    return new Promise((resolve, reject) => {
        const crypto = require('crypto');
        // Access properties correctly from the nested structure
        let hmac = crypto.createHmac('sha256', 'dl0Hy9nM5tIuqoqfIsNvWwas')
        hmac.update(
            String(details['order[generateOrder][id]']) + '|' +
           
            String(details['payment[razorpay_payment_id]'])
        );
        hmac = hmac.digest('hex');

        console.log('orderid', details['order[generateOrder][id]']);
        console.log('paymentid', details['payment[razorpay_payment_id]']);
        console.log('signature', details['payment[razorpay_signature]']);
        
        if (hmac === details['payment[razorpay_signature]']) {
            console.log("Verify SUCCESS");
            resolve();
        } else {
            console.log("Verify FAILED");
            reject();
        }
    })
};



const verifyRazorpayPayment = (req, res) => {
    console.log('funtion')
    try {
        const { razorpayOrderId, razorpayPaymentId, secret } = req.body;
        verifyOrderPayment(req.body)
            .then(async () => {
                console.log("Payment SUCCESSFUL");

                res.json({ status: true });

            }).catch((err) => {
                console.log(err);
                res.json({ status: false, errMsg: 'Payment failed!' });
            });
    } catch (err) {
        console.log(err);
        res.json({ status: false, errMsg: 'Payment failed!' });
    }
}
const address = async(req, res)=>{
    try{
        res.render('users/addressPage')
    }catch(error){
        console.log(error.message)
    }
}
const couponGet =async(req, res)=>{
    try{
        console.log('fkjs')
        const currentDate = new Date();
        const coupons = await Coupon.find({
            isActive: false,
            expirationDate: { $gte: currentDate } // Coupons with expiration dates greater than or equal to the current date
        });
        res.render('users/couponPage',{coupons})
    }catch(error){
        res.render('error')
    }
}


const removeCart = async (req, res) => {
    
    try {
        const productIdToRemove = req.params.productId; 
        const cart = await Cart.findOne({ user: req.session.user_id }); 

        if (!cart || !productIdToRemove) {
            return res.status(404).json({ error: 'Cart or product not found' });
        }
        cart.products = cart.products.filter(productObj => productObj.product.toString() !== productIdToRemove);
        cart.products.pull(productIdToRemove);
        await cart.save();
        res.redirect('/cart');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    getCart,
    addToCart,
    shopCart,
    updateCart,
    checkout,
    addAddressToCheckout,
    address,
    placeOrder,
    populateProductDetails,
    generateOrderRazorpay,
    verifyRazorpayPayment,
    verifyOrderPayment,
    couponGet,
    applyCoupon,
    checkBalance,
    removeCart,
    cartt

}