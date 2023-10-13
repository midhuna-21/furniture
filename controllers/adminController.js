const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const User = require('../models/userModel');
const Product = require('../models/productModel')

// login
const logAdmin = async(req, res)=>{
    try{
        if(req.session.admin_id){
            res.redirect('/admin/dashboard')
        }else{
            res.render('admin/adminLogin')
        }
    }catch(error){
        res.render('/error')
    }
}

// verify login
const verifyAdminLogin = async(req, res)=>{

    console.log('adminlogin is work ')
    try{
        const email = req.body.email;
        const password = req.body.password;
        
        const adminData = await User.findOne({email:email, is_admin: true});
        
        if(adminData){
      
            const passwordMatch = await bcrypt.compare(password, adminData.password);
            if(passwordMatch){
                if(adminData.is_admin === false){
                    res.json({success: false,email:"please verify your mail."});
                }else{
                   
                    req.session.admin_id = adminData._id;
                    req.session.admin = adminData;
                    res.json({success: true});
                }
            }else{
                res.json({success: false, password: "password is wrong"}) 
            }
        }else{
            res.json({success: false,email:"Email  is incorrect"})
        }
    }catch(error){
        console.log(error.message)
        res.status(500).json({message:"Internal server error"})
    }
}
// users list
const getUsers = async(req, res) =>{
    try{
        const users = await User.find({is_admin: false});
        res.render('admin/adminUsers',{users}); 
    }catch(error){
        res.render('/error')
    }
}

const blockUnblock = async (req, res) => {
   
    try {
        const id = req.params.id; 
        console.log(id);
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        
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
        res.render('/error')
    }
}

module.exports = {
    logAdmin,
    verifyAdminLogin,
    getUsers,
    blockUnblock,
    adminLogout,
  
}