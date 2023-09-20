const express = require('express');
const user_route = express.Router();
const userController = require('../controllers/userController');
const ProductController = require('../controllers/productController');
const CartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController')
const auth = require('../middleware/auth')

user_route.get('/register',userController.loadRegister);
user_route.post('/register',userController.insertUser);
user_route.get('/register',userController.sendVerifyMail);
user_route.get('/userlogin',userController.loadLogin)   
user_route.post('/home',userController.verifyLogin)
user_route.get('/verifyotp',userController.otppage)
user_route.post('/verifyotp',userController.verifyOtp);
user_route.get('/', userController.loadHome);
user_route.get('/home', userController.loadHome);
user_route.get('/logout',userController.userLogout);
user_route.get('/otp',userController.otppp)
user_route.get('/search',ProductController.searchCategory);
user_route.get('/products',ProductController.allProducts);
user_route.get('/product',ProductController.products)
user_route.get('/productdetails',ProductController.productDetails)
user_route.get('/add-to-cart/:productId',CartController.getCart)
user_route.post('/add-item-to-cart',CartController.addToCart)
user_route.get('/remove/:productId',CartController.removeCart)
user_route.get('/cart',CartController.shopCart)
user_route.post('/updatedcart',CartController.updateCart)
user_route.get('/checkout',CartController.checkout)
user_route.get('/checkbalance',CartController.checkBalance)
user_route.get('/carts',CartController.cartt)
user_route.get('/address',CartController.address)
user_route.post('/address',CartController.addAddressToCheckout)
user_route.post('/checkout',CartController.placeOrder)
user_route.post('/verifyPayment',CartController.verifyRazorpayPayment)
user_route.get('/orderlist',orderController.orderList)
user_route.get('/orderdetail/:orderId',orderController.orderDetails)
user_route.post('/ordercancel',orderController.cancelOrder)
user_route.post('/orderreturn',orderController.returnOrder)
user_route.get('/profile',userController.userProfile)
user_route.get('/editaddress',userController.editAddress)
user_route.post('/editaddress',userController.editAddpost)
user_route.get('/email',userController.emailPage);
user_route.post('/email',userController.resetPasswordemail)
user_route.get('/newPassword',userController.resetPassword)
user_route.post('/newPassword',userController.newPassword);
user_route.get('/coupons',CartController.couponGet)
user_route.post('/couponget',CartController.applyCoupon)
user_route.get('/wallet',orderController.walletDispaly)
user_route.get('/invoice',orderController.getOrderInvoice)
module.exports = user_route;






 