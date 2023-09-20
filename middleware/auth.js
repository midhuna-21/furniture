const User = require('../models/userModel')

module.exports = {
    checkSession: async (req, res, next) => {
        if (req.session.user){
          
            const user = await User.findById(req.session.user._id);
            
            if (!user || !user.isActive) {
                req.session.destroy();
                return res.redirect("/home");
            }
            next();
        } else {
            res.redirect("/home");
        }
    },
    isAdminAuthorized: (req, res, next) => {
        if (req.session.admin && req.session.admin.is_admin === true)  next()
        else res.redirect("/admin/login")
    },
    
      
}