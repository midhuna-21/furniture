const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Wallet = require("../models/walletModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const configs = require("../config/config");
const dotenv = require('dotenv');
dotenv.config(); 


// password hashing
const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
};
// login
const loadLogin = async (req, res) => {
    try {
        const messages = [];
        res.render("users/userlogin", { messages });
    } catch (error) {
        console.log(error.message);
    }
};
// register
const loadRegister = async (req, res) => {
    try {
        const messages = [];
        res.render("users/userRegistration", { messages });
    } catch (error) {
        console.log(error.message);
    }
};
// insert credentials in register form
const insertUser = async (req, res) => {
    try {
        const spassword = await securePassword(req.body.password);
        const existingUser = await User.findOne({ email: req.body.email });
        const existingPhoneNumber = await User.findOne({ tel: req.body.tel });
        if (existingUser) {
            console.log;
            return res.json({
                success: false,
                email: "Email is already registered.",
            });
        } else if (existingPhoneNumber) {
            return res.json({
                success: false,
                tel: "Phone number is already registered.",
            });
        }

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            tel: req.body.tel,
            password: spassword,
            otp: 0,
            is_admin: false,
            isActive: true,
        });

        req.session.guest_id = user._id;
        const userData = await user.save();

        if (userData) {
            req.session.otp = await sendVerifyMail(
                req.body.name,
                req.body.email,
                userData._id
            );
            req.session.time = Date.now();
            res.json({ success: true });
        } else {
            res.status(400).json({
                success: false,
                messages: ["Failed to register user"],
            });
        }
    } catch (error) {
        console.log(error.message); 
        res.status(500).json({
            success: false,
            messages: ["An error occured during registration"],
        });
    }
};

// email sending process
const sendVerifyMail = async (name, email, otp) => {
    const email1=process.env.EMAIL
    const password=process.env.PASSWORD
    console.log('email',email1)
    console.log('pad',password)
   
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user:process.env.EMAIL,      
                pass:process.env.PASSWORD,
            }
        });
        var otp = generateOtp();
        const mailOptions = {
            from: process.env.PASSWORD,
            to: email,
            subject: 'For Verification mail',
            html: `<p> Hi ${name},your otp is ${otp} verify</a> your mail</p>`,

        };

const hai='hello'






        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email has been sent:", info.response);
                console.log('otp', otp)
            }
        });
    } catch (error) {
        console.log("Error sending verification email", error);
        throw new Error("Error sending verification email.");
    }
    return otp;
};

const verifyOtp = async (req, res) => {
    const isReset = req.query.reset === '1'
    try {
        const forgotUserId = req.session.forgot_user_id;
        let userId = req.session.guest_id;
        if (isReset) userId = forgotUserId
        if (isReset && !userId) {
            return res.json({ success: false, message: "Pls reset password again" });
        }
        if (!userId && !isReset)
            return res.json({ success: false, message: "Pls register again" });
        const enteredOtp = req.body.otp;
        const storedOtp = req.session.otp;
        const prevTime = req.session.time;
        const currTime = Date.now();
        console.log(currTime - prevTime);
        console.log('entered', enteredOtp);
        console.log('stored', storedOtp)
        if (currTime - prevTime > 60 * 1000)
            return res.json({ success: false, message: "OTP Timed out" });

        if (enteredOtp == storedOtp) {
            console.log("OTP is correct");
            req.session.userLoggedIn = true;
            req.session.user_id = req.session.guest_id;
            const user = await User.findById(userId);

            if (user) {
                if (user.is_verified === 1) {
                    return res.json({
                        success: true,
                        redirect: "/newPassword",
                    });
                } else {
                    const updated = await User.updateOne(
                        { _id: userId },
                        { $set: { is_verified: 1 } }
                    );

                    if (updated) {
                        req.session.userLoggedIn = true;
                        return res.json({ success: true, redirect: "/" });
                    } else {
                        return res.json({
                            success: false,
                            message: "Update failed",
                        });
                    }
                }
            } else {
                res.json({ success: false, message: "user is not verified" });
            }
        } else {
            return res.json({ success: false, message: "Invalid OTP" });
        }
    } catch (error) {
        console.log(error.message);
        res.render("/error");
    }
};
// resend otp
const resendOtp = async (req, res) => {
    try {
        const userId = req.session.guest_id;
        if (!userId)
            return res
                .status(404)
                .json({ success: false, message: "User not found" });

        const user = await User.findById(userId);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }

        const email = user.email;
        const name = user.name;
        console.log('user email', email)
        const currentOtp = generateOtp();

        req.session.otp = await sendVerifyMail(name, email, currentOtp);
        req.session.time = Date.now();

        res.status(200).json({
            success: true,
            message: "Verification email resent",
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            success: false,
            message: "Error resending verification email",
        });
    }
};



const generateOtp = () => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    return otp;
};

// verify login
const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email });
        if (userData) {
            if (!userData.isActive) {
                return res.json({
                    message: "Your account is blocked from admin.",
                });
            }
            const passwordMatch = await bcrypt.compare(
                password,
                userData.password
            );

            if (passwordMatch) {
                if (userData.is_verified === 0) {
                    console.log("Email not verified");
                    return res.json({ message: "please verify your email" });
                } else {
                    req.session.user_id = userData._id;
                    req.session.userLoggedIn = true;
                    req.session.user = userData;
                    console.log("Login successful");
                    return res.json({ success: true });
                }
            } else {
                return res.json({ message: "Password is in incorrect" });
            }
        } else {
            return res.json({ message: "Email is in incorrect" });
        }
    } catch (error) {
        console.log(error.message);
        return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
};
const otp = async (req, res) => {
    const isReset = req.query.reset === '1'
    try {
        const userId = req.session.guest_id;
        const forgotUserId = req.session.forgot_user_id;
        if (!userId && !forgotUserId) return res.redirect("/register");
        res.render("users/otp", { isReset });
    } catch (error) {
        console.log(error.message);
    }
};
// home page
const loadHome = async (req, res) => {
    try {
        console.log('fjjsd')
        const userId = req.session.user_id;
        const products = await Product.find().sort({ createdAt: -1 }).limit(8);        ;
        const categories = await Category.find();
        const user = await User.findById(userId);

        let userLoggedIn = req.session.userLoggedIn ? true : false;
        if (userId) {
            res.render("users/home", {
                userLoggedIn,
                products,
                categories,
                user,
            });
        } else {
            console.log('produd',products)
            res.render("users/home", {
                products,
                userLoggedIn,
                categories,
                user,
            });
        }
    } catch (error) {
        console.log(error.message);
    }
};

// logout
const userLogout = async (req, res) => {
    try {
        req.session.destroy();
        userLoggedIn = false;
        res.redirect("/");
        console.log("hdhs");
    } catch (error) {
        console.log(error.message);
    }
};

const userProfile = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const user = await User.findById(userId);
        console.log(user);
        res.render("users/userProfile", { user });
    } catch (error) {
        console.log(error.message);
    }
};

const updateProfile = async (req, res) => {
    try {
        const data = req.body;
        const userId = req.session.user_id;
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    name: data.name,
                    tel: data.tel,
                    email: data.email,
                },
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("User updated successfully");

        res.json({ success: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
const passwordUpdate = async (req, res) => {
    try {
        const spassword = await securePassword(req.body.password.trim());
        const confirmedPassword = req.body.confirmPassword;

        console.log("password", spassword);
        console.log("confirm password", confirmedPassword);

        const userId = req.session.user_id;
        console.log("userId", userId);

        const passwordsMatch = await bcrypt.compare(
            confirmedPassword,
            spassword
        );

        if (passwordsMatch) {
            console.log("Passwords match");
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        password: spassword,
                    },
                },
                { new: true }
            );

            console.log("Updated User:", updatedUser);
            res.json({ success: true });
        } else {
            console.log("Passwords do not match");
            res.json({ success: false, message: "Passwords do not match" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const editAddress = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const user = await User.findById(userId);

        const addressIndex = req.params.addressIndex;
        console.log("index", addressIndex);
        const selectedAddress = user.address[addressIndex];
        console.log("selected address", selectedAddress);
        res.render("users/editAddress", { selectedAddress });
    } catch (error) {
        console.log(error.message);
    }
};

const editAddpost = async (req, res) => {
    try {
        const addressIndex = req.params.addressIndex;

        console.log("add", addressIndex);
        const userId = req.session.user_id;
        const { name, tel, address, state, city, pincode } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const updatedAddress = {
            name: name,
            tel: tel,
            address: address,
            state: state,
            city: city,
            pincode: pincode,
        };
        user.address[addressIndex] = updatedAddress;
        await user.save();
        res.json({ success: true, redirect: "/showAddress" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Server error" });
    }
};

const emailPage = async (req, res) => {
    try {
        res.render("users/emailenter");
    } catch (error) {
        console.log(error.message);
    }
};
const resetPasswordemail = async (req, res) => {
    try {

        const email = req.body.email;
        const user = await User.findOne({ email: email });

        if (user) {
            const otp = await sendVerifyMail(user.name, email);

            req.session.otp = otp;
            req.session.resetEmail = email;
            req.session.forgot_user_id = user._id;
            req.session.time = Date.now()
           
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        res.render("users/resetPassword");
    } catch (error) {
        console.log(error.message);
    }
};

const newPassword = async (req, res) => {
    try {
        console.log("fj");
        const { password } = req.body;
        const email = req.session.resetEmail;
        const user = await User.findOne({ email: email });

        if (user) {
            const spassword = await securePassword(password);
            user.password = spassword;
            await user.save();
            req.session.userLoggedIn = true;
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: "Internal server error" });
    }
};

const showWalletHistory = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const itemsPerPage = 3;

  
        const wallet = await Wallet.findOne({ userId: req.session.user_id });
     
        const totalTransactions = wallet ? wallet.transactions.length : 0;
        const totalPages = Math.ceil(totalTransactions / itemsPerPage);

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        const sortedTransactions = wallet
            ? wallet.transactions.sort((a, b) => b.date - a.date)
            : [];
        const transactions = wallet
            ? wallet.transactions.slice(startIndex, endIndex)
            : [];
        
        res.render("users/walletHistory", {
            wallet,
            transactions,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.error(error);
        res.render("error", { message: "An error occurred." });
    }
};

const showAddress = async (req, res) => {
    try {
        const userId = req.session.user_id;
        console.log("user", userId);
        const user = await User.findById(userId);
        res.render("users/showAddress", { user });
    } catch (error) {
        console.log(error.message);
    }
};
const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const addressIndex = req.params.addressIndex; 

        const user = await User.findById(userId);

        if (addressIndex >= 0 && addressIndex < user.address.length) {
            user.address.splice(addressIndex, 1);
            await user.save();

            res.redirect("/showAddress");
        } else {
            res.redirect("/showAddress");
        }
    } catch (error) {
        console.log(error.message);
    }
};

const selectedAddress = async (req, res, next) => {
    try {
        let userId = req.session.user_id;
        let addressIndex = req.params.index;

        await User.findById(userId);
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    loadRegister,
    insertUser,
    sendVerifyMail,
    verifyOtp,
    generateOtp,
    loadLogin,
    verifyLogin,
    loadHome,
    userLogout,
    userProfile,
    editAddress,
    editAddpost,
    emailPage,
    resetPasswordemail,
    resetPassword,
    newPassword,
    otp,
    showWalletHistory,
    updateProfile,
    passwordUpdate,
    resendOtp,
    showAddress,
    deleteAddress,
};
