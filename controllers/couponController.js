
const mongoose = require('mongoose');
const session = require('express-session')
const Coupon = require('../models/couponModel')



const couponList = async (req, res) => {
    try {
        console.log('couponlist function')
        const coupons = await Coupon.find()
      res.render("admin/coupon",{coupons});
    } catch (error) {
      res.render('users/error')
    }
  }
 
  const createCoupon = async (req, res) => {
    try {
        const { code, description, discountType, discountAmount, minimumAmount, maxRedemptions, expirationDate,totalRedemptions } = req.body;

        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ error: 'Coupon code already exists' });
        }
        console.log('fgh')
        const newCoupon = new Coupon({
            code:code,
            description:description,
            discountType:discountType,
            discountAmount:discountAmount,
            minimumAmount:minimumAmount,
            maxRedemptions:maxRedemptions,
            totalRedemptions:totalRedemptions,
            expirationDate:expirationDate,
        });
        await newCoupon.save();
       res.render('admin/coupon')
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

  module.exports = {
    couponList,
    createCoupon
  }