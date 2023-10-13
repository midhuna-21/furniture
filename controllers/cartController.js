const User = require('../models/userModel')
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Category = require('../models/productModel');
const Order = require('../models/orderModel')
const Coupon = require('../models/couponModel')
const Wallet = require('../models/walletModel')
const walletHelper = require('../helper/walletHelper')

const Razorpay = require('razorpay');
const instance = new Razorpay({ key_id: 'rzp_test_XLuQj8MFj0FaxS', key_secret: 'dl0Hy9nM5tIuqoqfIsNvWwas' });


const populateProductDetails = async (cart) => {
    const populatedProducts = await Promise.all(cart.products.map(async (product) => {
        const productDetails = await Product.findById(product.product);
        return { ...product.toObject(), productDetails };
    }));

    const populatedCart = cart.toObject();
    populatedCart.products = populatedProducts;

    return populatedCart;
};
// cart page
const shopCart = async (req, res) => {
    try {

        const category = await Category.find();
        const products = await Product.find();
        const userId = req.session.user_id;
        const cart = await Cart.findOne({ user: userId }).populate({ path: "products.product" });

        if (!cart) {
            const emptyCart = { products: [] };

            res.render("users/cartPage", { cart: emptyCart, category, products, calculateTotalPrice: 0 });
        } else {

            const populatedCart = await populateProductDetails(cart);
            let calculateTotalPrice = 0;
            for (const cartProduct of populatedCart.products) {
                const product = cartProduct.product;
                const cartQuantity = cartProduct.quantity;
                calculateTotalPrice += product.productprice * cartQuantity;
            }
            res.render("users/cartPage", { cart: populatedCart, category, products, calculateTotalPrice });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('An error occurred while processing the cart.');
    }
};


// add product to cart 
const addToCart = async (req, res) => {

    try {
       
        const userId = req.session.user_id;
        const { productId, quantity } = req.body;
      
        if (!req.session.user_id) {
          return  res.json({user:false})
        } else {
            const product = await Product.findById(productId);
            console.log(product)
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            console.log(product.quantity)
            if (quantity <= 0) {
                return res.json({ success: false, message: 'Invalid quantity' });
            }
            if (product.quantity < quantity) {
                return res.json({ success: false, message: `Only ${product.quantity} units are available` });

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
            // product.quantity -= quantity;
            console.log('kj')
            await product.save();
            await cart.save();
            res.status(200).json({ success: true });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'An error occurred while adding the product to the cart' });
    }
};

const updateCart = async (req, res) => {
    const userId = req.session.user_id
    const { productId, quantity } = req.body;
    try {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
        const existingProduct = cart.products.find(cartProduct => cartProduct.product.equals(productId))
        if (!existingProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' })
        }
        existingProduct.quantity = quantity;
        await cart.save()
        res.status(200).json({ success: true, message: 'Cart updated successfully' })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ success: false, message: 'An error occured while updating the cart' })
    }
}
// chechout 
const checkout = async (req, res) => {
    try {
        const couponCode = req.query.couponCode;
        const userId = req.session.user_id;
        const user = await User.findById(userId);
        const cart = await Cart.findOne({ user: userId }).populate('products.product');
        let calculateTotalPrice = 0;
        let discountAmount = 0;
        let coupon = null;

        if (cart) {
            for (const cartProduct of cart.products) {
                const product = cartProduct.product;
                const cartQuantity = cartProduct.quantity;
                calculateTotalPrice += product.productprice * cartQuantity;

            }
        }

        req.session.calculateTotalPrice = calculateTotalPrice;

        if (couponCode) {
            const selectedCoupon = await Coupon.findOne({ couponCode: couponCode });
            if (selectedCoupon) {

                discountAmount = (calculateTotalPrice * selectedCoupon.discount) / 100;
                if (discountAmount > selectedCoupon.maxAmount) {
                    discountAmount = selectedCoupon.maxAmount
                
                }
                coupon = selectedCoupon;

            } else {
                console.log('Selected coupon not found');
            }
        }
        calculateTotalPrice -= discountAmount;
        req.session.totalAmountCoupon = calculateTotalPrice
        const discount = discountAmount;
        const coupons = await Coupon.find();

        let wallet = await Wallet.findOne({ userId: userId });
        if (!wallet) {
            wallet = new Wallet({
                userId: userId,
                balance: 0,
            });
        }
        console.log('totalprice', discount)
        res.render('users/checkout', {
            user,
            cart,
            calculateTotalPrice,
            discount,
            coupon,
            wallet,
            coupons
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while processing the checkout.');
    }
};
const couponGet = async (req, res) => {
    try {

        const calculateTotalPrice = req.session.calculateTotalPrice;
        const currentDate = new Date();
        const coupons = await Coupon.find({
            isListed: true,
            expirationDate: { $gte: currentDate }
        });
        res.render('users/couponPage', { coupons, calculateTotalPrice })
    } catch (error) {
        res.render('/error')
    }
}
const applyCoupon = async (req, res) => {
    try {
        if (req.session.user_id) {
            const { couponCode } = req.body;
            const coupon = await Coupon.findOne({ couponCode: couponCode });
            console.log('coupon', coupon)
            if (coupon) {
                res.json({ success: true, couponCode: coupon.couponCode });
            } else {
                res.status(404).json({ success: false, error: 'Coupon not found' });
            }
        } else {
            res.status(401).json({ success: false, error: 'User not logged in' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};



const checkBalance = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const wallet = await Wallet.findOne({ userId: userId });
        res.json({ walletBalance: wallet.balance })
    } catch (error) {
        console.log(error.message)
    }
}
const addAddressToCheckout = async (req, res) => {
    const ret = req.query.ret || ''
    try {

        const userId = req.session.user_id

        const { name, address, city, state, pincode, tel } = req.body;

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

        res.json({ success: true, ret });
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ error: 'Internal server error' });

    }
}
const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const cart = await Cart.findOne({ user: userId }).populate('products.product');
        const user = await User.findById(userId);
        const { paymentMethod } = req.body;

        if (!cart || cart.products.length === 0) {
            return res.json({ error: 'Cart is empty' });
        }

        if (user && user.address && cart) {
            const address = user.address.id(req.body.addressId);

            let calculateTotalPrice = 0;

            for (const item of cart.products) {
                const product = await Product.findById(item.product._id);

                if (product) {
                    calculateTotalPrice += product.productprice * item.quantity;
                    const newQuantity = product.quantity - item.quantity;

                    await Product.updateOne(
                        { _id: item.product._id },
                        { quantity: newQuantity }
                    );
                }
            }
            if (req.session.totalAmountCoupon) {
                calculateTotalPrice = req.session.totalAmountCoupon
            }

            if (paymentMethod === 'wallet') {
                const wallet = await Wallet.findOne({ userId: userId });

                if (wallet && wallet.balance >= calculateTotalPrice) {
                    const transactionType = 'debit';
                    const updatedBalance = wallet.balance - calculateTotalPrice;
                    wallet.balance = updatedBalance;

                    await wallet.save();

                    const newOrder = new Order({
                        user: userId,
                        products: cart.products.map((item) => ({
                            productId: item.product._id,
                            quantity: item.quantity,
                        })),
                        address: address,
                        totalprice: calculateTotalPrice,
                        paymentMethod: paymentMethod,
                    });

                    console.log('Order saving processing..');
                    await newOrder.save();
                    cart.products = [];
                    await cart.save();
                    await walletHelper.updateWalletBalance(userId, calculateTotalPrice, transactionType);

                    res.json({ calculateTotalPrice, method: 'wallet' });
                } else {
                    res.json({ error: 'Insufficient balance in wallet' });
                }
            } else if (paymentMethod === 'cod') {

                const newOrder = new Order({
                    user: userId,
                    products: cart.products.map((item) => ({
                        productId: item.product._id,
                        quantity: item.quantity,
                    })),
                    address: address,
                    totalprice: calculateTotalPrice,
                    paymentMethod: paymentMethod,
                });

                console.log('Order saving processing..');
                await newOrder.save();
                cart.products = [];
                await cart.save();
                res.json({ method: 'cod' });
            } else if (paymentMethod === 'online') {
                const newOrder = new Order({
                    user: userId,
                    products: cart.products.map((item) => ({
                        productId: item.product._id,
                        quantity: item.quantity,
                    })),
                    address: address,
                    totalprice: calculateTotalPrice,
                    paymentMethod: paymentMethod,
                });
                req.session.newOrder = newOrder;
                const savedOrder = req.session.newOrder
                console.log('orders before saving',savedOrder)
                const generateOrder = await generateOrderRazorpay(
                    savedOrder._id,
                    calculateTotalPrice
                );
                
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



const verifyRazorpayPayment = async (req, res) => {
    console.log('funtion')
    const userId = req.session.user_id;
    const cart = await Cart.findOne({ user: userId }).populate('products.product');
    try {
        const { razorpayOrderId, razorpayPaymentId, secret } = req.body;
        verifyOrderPayment(req.body)
            .then(async () => {
                console.log("Payment SUCCESSFUL");
                const orders = req.session.newOrder
                const saveOrder = new Order(orders)
                console.log('orderee',saveOrder)
                await saveOrder.save()

                cart.products = [];

                await cart.save();
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
const address = async (req, res) => {
    const ret = req.query.ret || ''
    try {
        res.render('users/addressPage', { ret })
    } catch (error) {
        console.log(error.message)
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

    shopCart,
    addToCart,
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


}