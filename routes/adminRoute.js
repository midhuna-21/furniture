const express = require('express');
const admin_router = express.Router();
const config = require('../config/connection');
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')
const adminController = require('../controllers/adminController');
const categoryUpload = require('../multer/category'); 
const productUpload = require('../multer/product')

const orderController = require('../controllers/orderController')
const couponController = require('../controllers/couponController')

const salesReportController = require('../controllers/salesReportController')
const auth = require('../middleware/auth')
// adminController
admin_router.get('/login',adminController.logAdmin);
admin_router.post('/login',adminController.verifyAdminLogin)
admin_router.get('/adminlogout',adminController.adminLogout);
admin_router.get('/users',auth.isAdminAuthorized,adminController.getUsers);
admin_router.get('/block-unblock/:id',auth.isAdminAuthorized,adminController.blockUnblock); 

// categoryController
admin_router.get('/addcategory',auth.isAdminAuthorized,categoryController.category)
admin_router.post('/addcategory',categoryUpload.single('file'),auth.isAdminAuthorized,categoryController.addCategory)
admin_router.get('/editcategory/:categoryId',auth.isAdminAuthorized, categoryController.editCategory);
admin_router.post('/editcategory/:categoryId',categoryUpload.single('file'), auth.isAdminAuthorized,categoryController.editCategoryPost);

admin_router.get('/unlistcategory/:categoryId',auth.isAdminAuthorized, categoryController.unListCategory);
admin_router.get('/listcategory/:categoryId',auth.isAdminAuthorized, categoryController.listCategory);


// productController
admin_router.get('/addproduct',auth.isAdminAuthorized,productController.addProductPage)  
admin_router.post('/addproduct',productUpload.array('file'),auth.isAdminAuthorized,productController.addProduct)
admin_router.get('/products',auth.isAdminAuthorized,productController.product);
// admin_router.get('/deleted/:productId',productController.deleteProduct);
admin_router.get('/edit-product/:productId',auth.isAdminAuthorized,productController.editProductPage);
admin_router.post('/edit-product/:productId',productUpload.array('file'),auth.isAdminAuthorized,productController.editProduct);
admin_router.get('/unlistproduct/:productId', productController.unListProduct);
admin_router.get('/listproduct/:productId', productController.listProduct);
// admin_router.get('/product',productController.productGrid)

//ordermanagement 
admin_router.get('/orders',auth.isAdminAuthorized,orderController.orderManagement)
admin_router.get('/order/:orderId',auth.isAdminAuthorized,orderController.orderDetailView)

// coupon management
admin_router.get('/couponlist',auth.isAdminAuthorized,couponController.couponList)
admin_router.get('/coupons',auth.isAdminAuthorized,couponController.coupons)
admin_router.post('/addCoupon',auth.isAdminAuthorized,couponController.addCoupon)
admin_router.get('/edit-coupon/:id',auth.isAdminAuthorized,couponController.editCouponPage)
admin_router.post('/editcoupon/:id',auth.isAdminAuthorized,couponController.editCoupon)
admin_router.post('/unListCoupon', couponController.unListCoupon);
admin_router.post('/listCoupon', couponController.listCoupon);


admin_router.post('/status/:orderId/',auth.isAdminAuthorized,orderController.updateStatus)



admin_router.get('/dashboard',auth.isAdminAuthorized,orderController.getDashboard)
admin_router.get('/salesreport',auth.isAdminAuthorized,salesReportController.salesReport)

admin_router.get('/reports/sales/download/:type',auth.isAdminAuthorized,salesReportController.adminDownloadReports);


module.exports = admin_router;
 