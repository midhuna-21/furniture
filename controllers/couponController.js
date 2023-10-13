const mongoose = require('mongoose');
const Coupon = require('../models/couponModel')

const couponList = async (req, res) => {
    try {
        console.log('couponlist function')
        const coupons = await Coupon.find()
      res.render("admin/addCoupon",{coupons});
    } catch (error) {
      res.render('/error')
    }
  }
 
  const coupons = async (req, res) => {
    try {
        console.log('couponlist function')
        const coupons = await Coupon.find()
      res.render("admin/coupons",{coupons});
    } catch (error) {
      res.render('/error')
    }
  }
 

const addCoupon = async(req, res) => {
  try {  
      const { couponCode, description, discount, maxDiscount, minAmount, expirationDate } = req.body;
      const newCoupon = new Coupon({
          couponCode,
          description,
          discount,
          maxDiscount,
          minAmount,
          expirationDate,
          isListed: true
      });
      await newCoupon.save();

      res.json({ message: 'Coupon added successfully' });
  } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal server error' });
  }
}

const editCouponPage = async(req, res)=>{
  try {
    console.log('params id',req.params.id)
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).render('error', { message: 'Coupon not found' });
    }
    res.render('admin/editCoupon', { coupon });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Internal Server Error' });
  }
}

const editCoupon =async(req, res)=>{
  try{
    
    const couponId = req.params.id;
    const updates = req.body;

    const updatedCoupon = await Coupon.findByIdAndUpdate(couponId,updates)
 
    if(updatedCoupon){
      return res.json({success: true})
    }else{
      return res.status(400).json('error',{message: 'Coupon not found'})
    }
  }catch(error){
    console.error(err);
    return res.status(500).json({error: "internal server error"})
  }
}
const listCoupon = async (req, res) => {
  try {
    const couponId = req.body.couponId;
    const validCouponId = new mongoose.Types.ObjectId(couponId);
    const coupons = await Coupon.findByIdAndUpdate(validCouponId, { isListed: true });
    console.log('Coupon updated', coupons);

    res.redirect('/admin/coupons');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};

const unListCoupon = async (req, res) => {
  try {
    const couponId = req.body.couponId;
    const validCouponId = new mongoose.Types.ObjectId(couponId);
    const coupons = await Coupon.findByIdAndUpdate(validCouponId, { isListed: false });
    console.log('Coupon updated', coupons);

    res.redirect('/admin/coupons');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};

  module.exports = {
    couponList,
    addCoupon,
    coupons,
    editCouponPage,
    editCoupon,
    unListCoupon,
    listCoupon
   
  }