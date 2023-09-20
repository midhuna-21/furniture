const mongoose = require('mongoose')
const session = require('express-session') 
const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const productOffer = require('../models/productOfferModel')
const categoryOffer = require('../models/catOfferModel')

const categoryOffers = async(req, res)=>{
    try{
        const categories = await Category.find() 
        const Offers = await categoryOffer.find()
        res.render('admin/categoryOffer',{categories,Offers})
    }catch(error){
        console.log(error.message)
    }
}
const createCategoryOffer = async(req, res)=>{
    try{
        const { title, endDate,startDate, description,categoryname, discount } = req.body;
        const offer = new categoryOffer({
            title,
            description,
            startDate,
            endDate,
            categoryname,
            discount,
            isActive: true
            
        });
        const save = await offer.save();
        console.log("catoff added successfully");

       
        res.redirect('/admin/categoryOffer')
    }catch(error){
        
        console.log(error.message);
    }
}
const productOffers = async(req, res)=>{
    try{
        const offers = await productOffer.find()
        res.render('admin/productOffer',{offers})
    }catch(error){
        console.log(error.message)
    }
}
const createProductOffer = async(req, res)=>{
    try{
        const { title,discount,endDate,startDate,description } = req.body;
        const offer = new productOffer({
            title,
            description,
            discount,
            startDate,
            endDate,
            isActive: true
            
        });
        const save = await offer.save();
        console.log("productoff added successfully");

       
        res.redirect('/admin/productOffer')
    }catch(error){
        
        console.log(error.message);
    }
}
module.exports = {
    categoryOffers,
    createCategoryOffer,
    productOffers ,
    createProductOffer
   
}