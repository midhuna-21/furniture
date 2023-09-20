const mongoose = require('mongoose');
const cropImage = require('../multer/categoryImgCrop')
const Category = require('../models/categoryModel');

const category = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.render('admin/adminCategory', { categories });
    } catch (error) {
        console.log(error.message)
    }
}
const addCategory = async (req, res) => {
    try {
        await cropImage.crop(req);
        const images = req.file.filename
        //checking if category already exist
        const cat=await Category.findOne({categoryname:req.body.categoryname})
        console.log(cat)
        if(cat)return res.json({message:"Category name already exist"})

        const newCategory = new Category({
            categoryname: req.body.categoryname,
            description: req.body.description,
            image: images,
            isListed: true
        });
        
        await newCategory.save();
        res.json({ success: true})
    } catch (error) {
      
        console.log(error.message);
        res.status(500).json({ success: false, message: "Error adding category" });
    }
}

const editCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const categories = await Category.findById(categoryId)
        res.render('admin/editCategory', { categories })
    } catch (error) {
        console.log(error.message)
    }
}
const editCategoryPost = async (req, res) => {
    try {
        const categoryid = req.params.categoryId;
        const categoryId = await Category.findById(categoryid)
       
        if (!req.file) {
            const updatedData = {
                categoryname: req.body.categoryname,
                description: req.body.description,
                isListed: true
            };
  
            await Category.findByIdAndUpdate(categoryId, updatedData);
           
            res.json({ success: true})
        } else {

            await cropImage.crop(req);
            const images = req.file.filename;
            const updatedDataWithImage = {
                categoryname: req.body.categoryname,
                description: req.body.description,
                image: images,
                isListed: true
            };
        
            await Category.findByIdAndUpdate(categoryId, updatedDataWithImage);
            res.json({ success: true})
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: "Error adding category" });
    }
};

const unListCategory = async (req, res) => {
    try {
        console.log('unlisstt')
        const categoryId = req.params.categoryId;
        console.log(categoryId)
        const validCateogryId = new mongoose.Types.ObjectId(categoryId);
        await Category.findByIdAndUpdate(validCateogryId, { isListed: false });

        res.redirect(302, '/admin/addcategory')
    } catch (error) {
        console.log(error.message);
    }
}
const listCategory = async (req, res) => {
    try {
        console.log('listtt')
        const categoryId = req.params.categoryId;
        const validCategoryId = new mongoose.Types.ObjectId(categoryId);
        await Category.findByIdAndUpdate(validCategoryId, { isListed: true });
        res.redirect(302, '/admin/addcategory')
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    category,
    addCategory,
    editCategory,
    listCategory,
    unListCategory,
    editCategoryPost
}