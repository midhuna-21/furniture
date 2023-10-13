const User = require("../models/userModel");

module.exports = {
    login: async (req, res, next) => {
        try {
            if (req.session.user_id) res.redirect("/");
            else next();
        } catch (error) {
            console.log(error.message);
        }
    },
    checkSession: async (req, res, next) => {
        console.log(req.session.user_id);

        if (req.session.user_id) {
            const user = await User.findById(req.session.user_id);
            console.log(user);

            if (!user || !user.isActive) {
                req.session.destroy();
                return res.redirect("/");
            }
            console.log("user active");
            next();
        } else {
            res.redirect("/userlogin");
        }
    },
    adminlogin: async (req, res, next) => {
        try {
            if (req.session.user_id) {
                res.redirect("/admin/dashboard"); 
            } else {
                next();
            }
        } catch (error) {
            console.log(error.message);
        }
    },
    isAdminAuthorized: (req, res, next) => {
        if (req.session.admin && req.session.admin.is_admin === true) next();
        else res.redirect("/admin/login");
    },
};
