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
// products
const product = async(req, res)=>{
    try{
        const products = await Product.find()
        res.render('admin/products',{products})
    }catch(error){
        console.log(error.message)
    }
}

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
         console.log('produ',productId)
        const validProductId = new mongoose.Types.ObjectId(productId);
        console.log('vval',validProductId)
        // Make sure you await the query to find and update a single product
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
        console.log('produ',productId)
        const validProductId = new mongoose.Types.ObjectId(productId);
        console.log('vval',validProductId)
        // Make sure you await the query to find and update a single product
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


// list Categories based on products
const allProducts = async (req, res) => {
    try {
      const search = req.query.search;
  
      // Find all categories with at least one listed product
      const categories = await Category.aggregate([
        {
          $match: { isListed: true },
        },
        {
          $lookup: {
            from: 'products', // Assuming the name of your products collection
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
  
      // If categoryname is not provided or is 'all', set it to 'all' and retrieve all products
      const categoryname = req.query.categoryname || 'all';
  
      let products;
      if (categoryname === 'all') {
        if (search) {
          products = await Product.find({
            productname: { $regex: new RegExp(search) },
            isListed: true, // Only display listed products
          })
            .sort({ date: -1 }) // Sort by the 'date' field in descending order (newest first)
            .lean();
        } else {
          // If no search criteria, display all products that are listed (isListed is true)
          products = await Product.find({ isListed: true })
            .sort({ date: -1 }) // Sort by the 'date' field in descending order (newest first)
            .lean();
        }
      } else {
        // Find the category by name
        const selectedCategory = categories.find((cat) => cat.categoryname === categoryname);
  
        // If a specific category is provided and it's not found, handle the error
        if (!selectedCategory) {
          console.log('Category not found');
          return res.render('users/products', { categories, products: [], categoryname });
        }
  
        // Query products based on the selected category and whether they are listed (isListed is true)
        products = await Product.find({
          categoryname: selectedCategory.categoryname,
          isListed: true,
        })
          .sort({ date: -1 }) // Sort by the 'date' field in descending order (newest first)
          .lean();
      }
  
      console.log(products);
  
      return res.render('users/products', { categories, products, categoryname });
    } catch (error) {
      console.log(error.message);
      // Handle any other errors that might occur during the execution of the code
      return res.status(500).send('Internal Server Error');
    }
  };
  
  
// product Details
const productDetails = async(req, res)=>{
    try{
        console.log('gjoj')
        const products = await Product.find({_id: req.query.productid})
       
        res.render('users/productdetail',{products})
    }catch(error){
        console.log(error.message);
    }
}
const searchCategory = async(req, res)=>{
    console.log('keri')
    try {
        const searchQuery = req.query.search;
        const category = await Category.findOne({ categoryname: searchQuery });
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        const products = await Product.find({ category: category._id });

        res.status(200).json({ category, products });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
const products = async(req, res)=>{
    try{
        res.render('users/products.ejs')
    }catch(error){
        console.log(error.message)
    }
}


module.exports={
    addProductPage,
    addProduct,
    product,
    products,
    // deleteProduct,
    listProduct,
    unListProduct,
    editProductPage,
    editProduct,
    allProducts,
    productDetails,
    searchCategory ,
    
}
