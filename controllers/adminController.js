const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const User = require('../models/userModel');
const Product = require('../models/productModel')
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel')
const Coupon = require("../models/couponModel");
const userController = require('../controllers/userController');


// login
const logAdmin = async(req, res)=>{
    try{
        res.render('admin/adminLogin')
    }catch(error){
        console.log(error.message)
    }
}
//infinite looping in js
// i=0;
// while(i == i){
//     console.log("Hai midhuna")
// }

// verify login
const verifyAdminLogin = async(req, res)=>{

    console.log('adminlogin is work ')
    try{
        const email = req.body.email;
        const password = req.body.password;
        
        const adminData = await User.findOne({email:email});
        
        if(adminData){
            console.log('jnfkj')
            const passwordMatch = await bcrypt.compare(password, adminData.password);
            if(passwordMatch){
                if(adminData.is_admin === false){
                    res.render('admin/adminLogin',{message:"please verify your mail."});
                }else{
                    console.log('work');
                    req.session.user_id = adminData._id;
                    req.session.admin = adminData;
                    const products = await Product.find()
                    res.redirect('/admin/products');
                }
            }else{
                res.render('admin/adminLogin',{messages:"Email and password is incorrect"}) 
            }
        }else{
            res.render('admin/adminLogin',{messages:"Email and password is incorrect"})
        }
    }catch(error){
        console.log(error.message)
    }
}
// users list
const getUsers = async(req, res) =>{
    try{
        console.log('jdgkjsnd')
        const users = await User.find();
        res.render('admin/adminUsers',{users}); //passing the userdata to the ejs file
    }catch(error){
        console.log(error.message);
    }
}

const blockUnblock = async (req, res) => {
   
    try {
        const id = req.params.id; // Use req.params.id to access route parameter
        console.log(id);
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        // Toggle isActive
        user.isActive = !user.isActive;
        await user.save();
        res.redirect('/admin/users');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};




// logout
const adminLogout = async(req, res)=>{
    try{
        res.redirect('/admin/login')
    }catch(error){
        console.log(error.message)
    }
}


// const orderStatus = async(req, res)=>{
//     try{
//         const orderId = req.params.orderId;
//         const newStatus = req.body.newStatus;

//         const order = await Order.findById(orderId);
//         if (!order) {
//             return res.status(404).json({ success: false, message: 'Order not found' });
//         }

//         order.status = newStatus;
//         await order.save();

//         res.redirect('/admin/order',{}); 
//     }catch(error){
//         consol.elog(error.message)
//     }
// }
module.exports = {
    logAdmin,
    verifyAdminLogin,
    getUsers,
    blockUnblock,
    adminLogout,
  
    // orderStatus
}