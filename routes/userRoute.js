const express = require('express');
const user_route = express.Router();
const userController = require('../controllers/userController');
const ProductController = require('../controllers/productController');
const CartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController')
const WishlistController = require('../controllers/wishlistController')
const auth = require('../middleware/auth')

user_route.get('/register',auth.login,userController.loadRegister);
user_route.post('/register',userController.insertUser);
user_route.get('/otp',auth.login,userController.otp)
user_route.post('/verifyotp',userController.verifyOtp);
user_route.get('/userlogin',auth.login,userController.loadLogin)   
user_route.post('/home',userController.verifyLogin)
user_route.get('/',userController.loadHome);


user_route.get('/email',userController.emailPage);
user_route.post('/email',userController.resetPasswordemail)
user_route.get('/newPassword',userController.resetPassword)
user_route.post('/newPassword',userController.newPassword);

user_route.get('/products',ProductController.allProducts);
user_route.get('/product',ProductController.products)
user_route.get('/productdetails',ProductController.productDetails)

// cart
user_route.post('/add-item-to-cart',auth.checkSession,CartController.addToCart)
user_route.get('/remove/:productId',auth.checkSession,CartController.removeCart)
user_route.get('/cart',auth.checkSession,CartController.shopCart)
user_route.post('/updatedcart',auth.checkSession,CartController.updateCart)
user_route.get('/checkout',auth.checkSession,CartController.checkout)
user_route.get('/checkbalance',auth.checkSession,CartController.checkBalance)

user_route.get('/address',auth.checkSession,CartController.address)
user_route.post('/address',auth.checkSession,CartController.addAddressToCheckout)
user_route.post('/checkout',auth.checkSession,CartController.placeOrder)
user_route.post('/verifyPayment',auth.checkSession,CartController.verifyRazorpayPayment)
user_route.get('/orderlist',auth.checkSession,orderController.orderList)
user_route.get('/orderdetail/:orderId',auth.checkSession,orderController.orderDetails)
user_route.post('/ordercancel',auth.checkSession,orderController.cancelOrder)
user_route.post('/orderreturn',auth.checkSession,orderController.returnOrder)
user_route.get('/profile',auth.checkSession,userController.userProfile)



user_route.get('/coupons',auth.checkSession,CartController.couponGet)
user_route.post('/couponget',auth.checkSession,CartController.applyCoupon)
user_route.get('/wallet',auth.checkSession,userController.showWalletHistory)
user_route.get('/invoice',auth.checkSession,orderController.getOrderInvoice)
user_route.post('/search',ProductController.searchProducts)
user_route.get('/logout',userController.userLogout);

user_route.post('/updateProfile',auth.checkSession,userController.updateProfile)
user_route.post('/updatePassword',auth.checkSession,userController.passwordUpdate)
user_route.post('/resendOtp',userController.resendOtp)
user_route.get('/showAddress',auth.checkSession,userController.showAddress)

user_route.get('/editaddress/:addressIndex',auth.checkSession,userController.editAddress);

user_route.post('/editaddress/:addressIndex',auth.checkSession,userController.editAddpost)
user_route.get('/deleteAddress/:addressIndex', auth.checkSession, userController.deleteAddress);


user_route.post('/addToWishlist/:productId',auth.checkSession,WishlistController.addToWishlist)
user_route.get('/wishlist',auth.checkSession,WishlistController.wishlists)
user_route.post('/removeWishlist/:productId',auth.checkSession,WishlistController.removeWishlist)
user_route.get('/removeWishlist/:productId',auth.checkSession,WishlistController.removeWishlistFromWihslist)
module.exports = user_route;






 