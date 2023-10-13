const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel')
const multer = require('multer');
const cropImage = require('../multer/productImgCrop')

// addproduct page
const addProductPage = async(req, res)=>{
    try{
        const categories = await  Category.find().lean()
        res.render('admin/adminProduct',{categories})
    }catch(error){
        console.log(error.message)
    }
}
// add product
const addProduct = async(req, res)=>{
    try{
        const { productname, categoryname, description, quantity, color, productprice, salesprice } = req.body;
        await cropImage.crop(req); 
        const images = req.files.map(file => file.filename);
        const productadd = new Product({
            productname,
            categoryname,
            description,
            quantity,
            color,
            productprice,
            salesprice,
            image: images,
            isListed: true
            
        });
        await productadd.save();
        res.redirect('/admin/products')
    }catch(error){
        console.log(error.message);
    }
}


const product = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const pageSize = 5; 

        const totalProducts = await Product.countDocuments();

        const totalPages = Math.ceil(totalProducts / pageSize);
        const skip = (page - 1) * pageSize;

        const products = await Product.find()
        .sort({ date: -1 })
            .skip(skip) 
            .limit(pageSize); 

        res.render('admin/products', {
            products,
            currentPage: page,
            totalPages,
            sort: '-date', 
        });
    } catch (error) {
        console.log(error.message);
    }
};


// edit the product page
const editProductPage = async(req, res)=>{
    try{
        const productId = req.params.productId;
        const product = await Product.findById(productId).lean();
        const categories = await Category.find().lean()
        res.render('admin/editProduct',{product ,categories})
    }catch(error){
        console.log(error.message)
    }
}
// edit product 
const editProduct = async (req, res) => {
    try {
        const productId = req.params.productId; // Extract product ID from URL parameter
        const validProductId = new mongoose.Types.ObjectId(productId);
        const updatedProductData = {
            productname:req.body.productname,
            categoryname:req.body.categoryname,
            description:req.body.description,
            quantity:req.body.quantity,
            color:req.body.color,
            productprice:req.body.productprice,
            salesprice:req.body.salesprice,
            isListed: true
            
        };
   
        if (req.files && req.files.length > 0) {
            await cropImage.crop(req);
            const newImages = req.files.map(file => file.filename);
            updatedProductData.image = newImages;
        }
        const updateProduct = await Product.findByIdAndUpdate(validProductId, updatedProductData);
        if (!updateProduct) {
            return res.status(404).send('Product not found or not updated.');
        } else {
            const products = await Product.find();
            console.log('Product updated successfully');
            const categories = await Category.find().lean()
            res.redirect('/admin/products')
        
        }
    } catch (error) {
        console.log(error.message);
    }
};
const listProduct = async (req, res) => {
    try {
      
        const productId = req.params.productId;
        const validProductId = new mongoose.Types.ObjectId(productId);
        const product = await Product.findByIdAndUpdate(validProductId, { isListed: true });
        console.log('product update',product)
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const unListProduct = async (req, res) => {
    try {
       
        const productId = req.params.productId;
        console.log('productId',productId)
        const validProductId = new mongoose.Types.ObjectId(productId);
        const product = await Product.findByIdAndUpdate(validProductId, { isListed: false });
        console.log('product update',product)
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const renderProductsPage = async (req, res, queryConditions) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = 4;

        const categories = await Category.aggregate([
            {
                $match: { isListed: true },
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'categoryname',
                    foreignField: 'categoryname',
                    as: 'products',
                },
            },
            {
                $addFields: {
                    hasListedProducts: {
                        $gt: [{ $size: '$products' }, 0],
                    },
                },
            },
            {
                $match: { hasListedProducts: true },
            },
        ]);

        const categoryname = req.query.categoryname || 'all';
        
        let totalProductsCount;
        let products;

        if (categoryname !== 'all') {
            const selectedCategory = categories.find((cat) => cat.categoryname === categoryname);
            console.log('seel', selectedCategory);
            if (!selectedCategory) {
                console.log('Category not found');
                return res.render('users/products', { categories, products: [], categoryname });
            }

            queryConditions.categoryname = selectedCategory.categoryname;
        }
        totalProductsCount = await Product.countDocuments(queryConditions);

        products = await Product.find(queryConditions)
            .sort({ date: -1 })
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage)
            .lean();

        const totalPages = Math.ceil(totalProductsCount / itemsPerPage);

        return res.render('users/products', {
            categories,
            products,
            categoryname,
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.log(error.message);
    }
};

// allProducts route handler
const allProducts = async (req, res) => {
  
    try {
        const listedCatgories = await Category.find({ isListed: true}).lean();
        const listedCategoryNames = listedCatgories.map((category) => category.categoryname);
        const queryConditions = {
            isListed: true,
            categoryname: {$in: listedCategoryNames},
        }
        await renderProductsPage(req, res, queryConditions);
    } catch (error) {
        console.log(error.message);
    }
};

// searchProducts route handler
const searchProducts = async (req, res) => {
    try {
        const searchQuery = req.body.search;
        const queryConditions = {
            categoryname: { $regex: new RegExp(searchQuery, 'i') },
        };

        // Call the common renderProductsPage function with search results
        await renderProductsPage(req, res, queryConditions);
    } catch (error) {
        console.error(error.message);
    }
};

// product Details
const productDetails = async(req, res)=>{
    try{
        const products = await Product.find({_id: req.query.productid})
        res.render('users/productdetail',{products})
    }catch(error){
        console.log(error.message);
    }
}

const products = async(req, res)=>{
    try{
        res.render('users/products')
    }catch(error){
        console.log(error.message)
    }
}


module.exports={
    addProductPage,
    addProduct,
    product,
    products,
    listProduct,
    unListProduct,
    editProductPage,
    editProduct,
    allProducts,
    productDetails,
    searchProducts ,
   
    
}
