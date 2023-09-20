const mongoose = require('mongoose');
const session = require('express-session')
const User = require('../models/userModel');
const Product = require('../models/productModel')
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const nocache = require('nocache');
const crypto = require('crypto');
const configs = require('../config/config')

let userLoggedIn = false;
let signup = false;
// password hashing
const securePassword = async (password) => {
    try{
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    }catch(error){
        console.log(error.message);
    }
};
// login user
const loadLogin = async (req, res) => {
    try {
        const messages = [];
        
        res.render('users/userlogin', { messages });
    } catch (error) {
        console.log(error.message);
    }
};
// register
const loadRegister = async (req, res) => {
    try { 
        const messages = [];
        res.render('users/userRegistration', { messages });
    } catch (error) {
        console.log(error.message);
    }
};
// insert credentials in register form
const insertUser = async (req, res) => {
    try {
        const spassword = await securePassword(req.body.password);
        
        if (!req.body.name || !req.body.email || !req.body.tel || req.body.password.length < 6) {
            return res.render('users/userRegistration', { messages: ['Please fill in all required fields.'] });
        }

        // Check for duplicate email
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.render('users/userRegistration', { messages: {email:'Email is already registered.'} });
        }
        const existingPhoneNumber = await User.findOne({tel: req.body.tel})
        if (existingPhoneNumber) {
            return res.render('users/userRegistration', { messages: {tel:'Phone number is already registered.'} });
        }
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            tel: req.body.tel,
            password: spassword,
            otp:0, 
            is_admin: false,
            isActive: true
        });
        req.session.otpMail = req.body.email;
        req.session.register = true;
        console.log(req.session.otpMail,'mail kitti');
        console.log('working?')
        
        const userData = await user.save();

        if (userData) {
            req.session.otp = await sendVerifyMail(req.body.name, req.body.email, userData._id);
            res.render('users/userOtpVerify');
        } else {
            res.render('users/userRegistration',  { messages: ['Failed to register user.'] });
        }

    } catch(error) {
        console.log(error.message);
        console.log('not work')
        res.render('users/userRegistration', { messages: ['An error occurred during registration.'] });
    }
};
// const userSignup = async(req, res) =>{
//     const data = await userHelper.insertUser(req, res);
//     signup = true;
//     if(data){
//         res.render('users/userOtpVerify')
//     }else{
//         res.redirect('/register')
//     }
// }
// email sending process
const sendVerifyMail = async (name, email, user_id, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: configs.emailUser,
                pass: configs.emailPassword
            }
        }); 
        var otp = generateOtp();
        const mailOptions = {
            from: configs.emailUser,
            to: email,
            subject: 'For Verification mail',
            html:`<p> Hi ${name},your otp is ${otp} verify</a> your mail</p>`,

        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email has been sent:", info.response);
                console.log('otp',otp)
            }
        });
    } catch (error) {
        console.log("Error sending verification email",error);
        throw new Error("Error sending verification email.");
    }
    return otp;
};
const resetPasswordemail = async(req, res)=>{
    try{
        const email = req.body.email;
        const userData = await User.findOne({ email: email });
        if(userData){
            const otp = await sendVerifyMail(userData.name, email);
            
            req.session.otp = otp;
            req.session.resetEmail =email;
            console.log(otp)
            req.session.forgotPassword = true;
            res.render('users/userOtpVerify', { email: email });
        } else {
           
            res.render('/error')
        }
        
    }catch(error){
        console.log(error.message)
    }
}
// otp verifying
const verifyOtp = async (req, res) => {
    console.log('hfgkd')
    try {
        const userId = req.session.otpMail;
        const enteredOtp = req.body.otp;
        const storedOtp = req.session.otp; 
        if (enteredOtp === storedOtp) {
        const updated = await User.updateOne({ email:userId }, { $set: { is_verified: 1 }});
        if(updated){
            if(req.session.forgotPassword){
                console.log(req.session.password)
                res.render('users/resetPassword')
            }else if(req.session.register){
                console.log(req.session.register)
                userLoggedIn = true;
                res.render('users/home',{userLoggedIn});
            }
            else{
                res.send('otp-verification-failed');
            }
        }
        else{
            res.render('/error')
        }
    }
 } catch (error) {
        console.log(error.message); 
        res.render('/error');
    }

};
// otp generation
const generateOtp = () => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString()
    return otp;
};
const otppage = async(req, res)=>{
    try{
        res.render('users/userOtpVerify')
    }catch(error){
        console.log(error.message)
    }
}

// verify login
const verifyLogin = async(req, res)=>{
    try{
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({email:email});
        if(userData){
            if (!userData.isActive) {
                
                return res.render('users/userlogin', { messages: "Your account is blocked. Please contact the administrator." });
            }
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if(passwordMatch){
                if(userData.is_verified === 0){
                    res.render('users/userlogin',{messages:"please verify your mail."});
                }else{
                    req.session.user_id = userData._id;
                    req.session.userLoggedIn = true;
                    req.session.user = userData;
                    const products = await Product.find()
                    res.render('users/home',{userLoggedIn: true , products});
                }
            }else{
                res.render('users/userlogin', { messages: {password: "Password is incorrect" } });

            }
        }else{
            res.render('users/userlogin',{messages: {email: "Email is incorrect"} });
        }
    }catch(error){
        console.log(error.message)
    
    }
}
const otppp = async(req, res) =>{
    try{
        res.render('users/userOtpVerify')
    }catch(error){
        console.log(error.message)
    }
}
// home page
const loadHome = async (req, res) => {
    try {
       
        const products = await Product.find()
        res.render('users/home',{products, userLoggedIn});
       
    } catch (error) {
        console.log(error.message);
    }
};
// logout 
const userLogout = async (req, res) => {
    try {
        req.session.destroy();
        userLoggedIn = false;
        res.redirect('/home');
        console.log('hdhs')
    } catch (error) {
        console.log(error.message);
    }
};
const userProfile = async(req, res)=>{
    try{
        const userId = req.session.user_id
        const user = await User.findById(userId);
        console.log(user)
        res.render('users/userProfile',{user})
    }catch(error){
        console.log(error.message)
    }
}

const editAddress = async(req, res)=>{
    try{
        const userId = req.session.user_id
        const user = await User.findById(userId)
        res.render('users/editAddress',{user})
    }catch(error){
        console.log(error.message)
    }
}
const editAddpost = async (req, res) => {
    try {
        const addressIndex = req.query.addressIndex;
        console.log(`Address Index: ${addressIndex}`);
      const userId = req.session.user_id;
      const { name, tel, address, state, city, pincode } = req.body;
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const updatedAddress = {
        name: name,
        tel: tel,
        address: address,
        state: state,
        city: city,
        pincode: pincode,
      };
      user.address[0] = updatedAddress;
      await user.save();
  
      res.redirect('/profile');
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
const emailPage = async(req, res)=>{
    try{
        res.render('users/emailenter')
    }catch(error){
        console.log(error.message)
    }
}

const resetPassword = async(req, res)=>{
    try{
        res.render('users/resetPassword')
    }catch(error){
        console.log(error.message)
    }
}
const newPassword = async(req, res)=>{
    try{
        const {password} = req.body;
        const email = req.session.resetEmail
        const user = await User.findOne({email})
        console.log(user)
        if(user){
            const spassword = await securePassword(password);
            user.password = spassword;
            userLoggedIn = true;
            res.render('users/home',{userLoggedIn})
        }
        
        await user.save()
    }catch(error){
        console.log(error.message)
    }
}
module.exports = {
    loadRegister,
    insertUser,
    // userSignup,
    sendVerifyMail,
    verifyOtp, 
    generateOtp,
    otppage,
    loadLogin,
    verifyLogin,
    loadHome,
    userLogout,
    userProfile,
    editAddress,
    editAddpost,
    emailPage,
    resetPasswordemail ,
    resetPassword ,
    newPassword,
    otppp,
    userLoggedIn

}