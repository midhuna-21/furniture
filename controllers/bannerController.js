const mongoose = require('mongoose');
const session = require('express-session') 
const User = require('../models/userModel')
const Banner = require('../models/bannerModel')
const cropImage = require('../multer/bannerImageCrop')


const banners = async(req, res)=>{
    try{
        const banners = await Banner.find()
        res.render('admin/banner',{banners})
    }catch(error){
        console.log(error.message)
    }
}
const createBanner = async(req, res)=>{
    try{
        const { title, date, expirationDate } = req.body;
        
        await cropImage.crop(req); 
        const images = req.files.map(file => file.filename);
        const banner = new Banner({
            title,
            date,
            expirationDate,
            image: images,
            isActive: true
            
        });
        const save = await banner.save();
        console.log("banner added successfully");

       
        res.redirect('admin/banners')
    }catch(error){
        
        console.log(error.message);
    }
}
module.exports= {
    banners,
    createBanner
}