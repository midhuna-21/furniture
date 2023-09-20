// const mongoose = require('mongoose');
// const session = require('express-session')
// const User = require('../models/userModel');
// const Product = require('../models/productModel')
// const Category = require('../models/categoryModel')
// const bcrypt = require('bcrypt');
// const nodemailer = require('nodemailer');
// const randomstring = require('randomstring');
// const nocache = require('nocache');
// const crypto = require('crypto');
// const configs = require('../config/config')
// const otpGenerator = require('otp-generator');
// const userHelper = require('../helper/userHelper')

// let signup = false;
// const securePassword = (password) => {
//     return bcrypt.hash(password, 10)
//     .then((passwordHash) =>{
//         return passwordHash;
//     })
//     .catch((error) =>{
//         console.log(error.message);
//         throw new Error('password hashing failed')
//     })

// }
// async function insertUser(req, res){
//     const password = req.body.password
//     return securePassword(password)
//     .then((spassword) =>{
//         if( !req.body.name || !req.body.email || !req.body.tel || req.body.password.length < 6) {
//             return ['please fill in all required fields'];
//         }
//     return User.findOne({ email: req.body.email})
//     .then((existingUser) =>{
//         if(existingUser) {
//             return ['Email is already exist'];
//         }
//         const user = req.body
//         req.session.otpMail= req.body.email
//         signup = true;
//         return User.create(user)
               
    
//     .then((userData)=>{
//         if (userData){
//            return sendVerifyMail(req.body.name, req.body.email, userData._id)
//            .then(() => null)
//             .catch(() => ['Failed to send verification']);
            
//         }else{
//             return ['Failed to register user.']
//         }
//     })
//     .catch(() => ['An error occured during user registeration'])
   
//     })
//     .catch(() => ['An error occured while checking for duplicate email'])
// })
// .catch(() => {
//     console.log(error.message);
//     return ['An error occured during registration']
// });

// }

// const sendVerifyMail = async(name, email, user_id, otp) =>{
//     const transporter = nodemailer.createTestAccount({
//         host: 'smtp.gmail.com',
//         port: 587,
//         secure: false,
//         requireTLS: true,
//         auth: {
//             user: configs.emailUser,
//             pass: configs.emailPassword
//         }
//     });
//     return generateOtp()
//     .then((generatedOtp) =>{
//         const mailOptions = {
//             form: configs.emailUser,
//             to: email,
//             subject: 'For Verification mail',
//             html: `<p> Hi ${name},your otp ${generatedOtp} verify your mail</p>`
//         }
//         return transporter.sendMail(mailOptions)
//         .then((info) => {
//             console.log("Email has been sent:", info.response);
//             req.session.otp = otp
//             return generatedOtp;
            
//         })
//         .catch((error) => {
//             console.log("Error sending email:",error);
//             throw new Error("Error sending verification email");
//         })
//     })
//     .catch((error) =>{
//         console.log("Error generating OTP",error)
//         throw new Error ("Error generating OTP");
//     })
// }
// const generateOtp = () => {
//     const otp = Math.floor(1000 + Math.random() * 9000).toString()
//     return otp;
// };


// // const verifyOtp = (req, res)=>{
// //     const userId = req.session.
// // }
// module.exports = {
//     securePassword,
//     sendVerifyMail,
//     insertUser,
//     verifyOtp
// }