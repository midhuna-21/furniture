const mongoose = require('mongoose');
const session = require('express-session')
const User = require('../models/userModel')
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel')
const Wallet = require('../models/walletModel')
const walletHelper = require('../helper/walletHelper')
const easyinvoice = require("easyinvoice");
const fs = require("fs");
const { Readable } = require('stream');

const orderDetails = async(req, res)=>{
    try{
   
        const orderId = req.params.orderId;
        const userId = req.session.user_id;
        const products = await Product.find()
        const user = await User.findById(userId)
        const order = await Order.findById(orderId).populate('products.productId user');
        res.render('users/orderdetails',{order,user,products})
    }catch(error){
        console.log(error.message)
    }
}

const orderList = async (req, res) => {
    
    try {
        const products = await Product.find();
        const userId = req.session.user_id;
        const user = await User.findById(userId);
        const order = await Order.find({ user: userId }).populate('products.productId');
        
        // Sort orders by orderDate in descending order (most recent first)
        order.sort((a, b) => b.orderDate - a.orderDate);

        const formattedOrders = order.map(order => ({
            ...order.toObject(),
            formattedOrderDate: order.orderDate.toLocaleDateString()
        }));
        
        res.render('users/orderlist', { order: formattedOrders, user, products });
    } catch (error) {
        console.log(error.message);
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.orderStatus === 'Cancelled') {
            return res.status(400).json({ message: 'Order is already cancelled' });
        }
        if (order.orderStatus === 'Delivered') {
            return res.status(400).json({ message: 'Cannot cancel a delivered order' });
        }

        // Calculate the difference in days between the order date and the current date
        const currentDate = new Date();
        const orderDate = order.orderDate;
        const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));

        if (daysDifference > 10) {
            return res.status(400).json({ message: 'Cannot cancel an order placed for more than 10 days' });
        }

        const canceledAmount = order.totalprice;
        const userId = order.user;
        await walletHelper.updateWalletBalance(userId, canceledAmount);
        order.orderStatus = 'Cancelled';
        await order.save();

        return res.status(200).json({ message: 'Order has been cancelled' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const returnOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.orderStatus === 'Placed') {
            return res.status(400).json({ message: 'Cannot return an order that is not placed' });
        }

        // Calculate the difference in days between the order date and the current date
        const currentDate = new Date();
        const orderDate = order.orderDate;
        const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));

        if (daysDifference > 10) {
            return res.status(400).json({ message: 'Cannot return an order placed for more than 10 days' });
        }

        // Add logic to handle the return process here
        // Set the order status to 'Returned' or similar
        order.orderStatus = 'Cancelled'; // You can customize this status

        await order.save();

        return res.status(200).json({ message: 'Product return initiated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};



const orderManagement = async(req, res)=>{
    try{
        console.log('ordermanage')
        const orders = await Order.find().populate('products.productId user');
        console.log('orders',orders)
        const formattedOrders = orders.map(order => {
            return {
                ...order.toObject(),
                formattedOrderDate: order.orderDate.toLocaleDateString()
            };
        });
        console.log('hfks')
        res.render('admin/orderManagement', { orders: formattedOrders });

    }catch(error){
        console.log(error.message)
           res.status(500).send('Internal Server Error');
    }
}
const orderDetailView = async(req, res)=>{
    console.log('orderdetail')
    try{
        const orderId = req.params.orderId;
        console.log('orderId',orderId)
        const orders = await Order.findById(orderId).populate('products.productId user');
        res.render('admin/orderDetail',{orders: [orders]})
    }catch(error){
        console.log(error.message)
    }
}
const updateStatus = async(req, res)=>{
    try{
       
        const { orderId } = req.params;
        const { newStatus } = req.body;
        console.log('nessta',newStatus)
          console.log('bbbbbb')
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        console.log('kkkkkk')
        if (order.orderStatus === 'Cancelled') {
            return res.status(400).json({ message: 'Order is already canceled' });
        }
        console.log('dddddddd')
        order.orderStatus = newStatus;
        console.log('newStatus:', newStatus);

        await order.save();

        res.json({ message: 'Order status updated successfully.', updatedStatus: order.orderStatus });

    }catch(error){
        console.log(error.message)
    }
}
const walletDispaly = async(req, res)=>{
    try{
        
            const userId = req.session.user_id; 
    
            const wallet = await Wallet.findOne({ userId });
            console.log('walle',wallet)
            if (!wallet) {
                return res.render('wallet', { walletTransactions: [] });
            }
            res.render('users/walletHistory', { walletTransactions: wallet });
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Internal Server Error');
        }
   
}


async function calculateDeliveredOrderTotal() {
  try {
    const totalData = await Order.aggregate([
      {
        $match: {
          orderStatus: 'Delivered',
        },
      },
      {
        $group: {
          _id: null,
          totalPriceSum: { $sum: '$totalprice' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (totalData.length === 0) {
      return {
        _id: null, 
        totalPriceSum: 0, // or any default value you prefer
        count: 0, // or any default value you prefer
      };
    }

    return totalData;
  } catch (error) {
    throw error;
  }
}



async function calculateCategorySales() {
  try {
    const categorySalesData = await Order.aggregate([
      {
        $unwind: '$products',
      },
      {
        $lookup: {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $unwind: '$productDetails',
      },
      {
        $match: {
          orderStatus: 'Delivered',
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDetails.categoryname',
          foreignField: 'categoryname',
          as: 'categoryDetails',
        },
      },
      {
        $unwind: '$categoryDetails',
      },
      {
        $group: {
          _id: '$productDetails.categoryname',
          categoryName: { $first: '$categoryDetails.categoryname' },
          totalSales: {
            $sum: { $multiply: ['$productDetails.productprice', '$products.quantity'] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          categoryName: 1,
          totalSales: 1,
        },
      },
    ]);

    return categorySalesData;
  } catch (error) {
    throw error; 
  }
}


async function calculateDailySales() {
  try {
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          orderStatus: 'Delivered', 
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$orderDate', 
            },
          },
          dailySales: {
            $sum: '$totalprice', 
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return dailySalesData;
  } catch (error) {
    throw error; 
  }
}

async function calculateOrderCountByDate() {
  try {
    const orderCountData = await Order.aggregate([
      {
        $match: {
          orderStatus: 'Delivered', 
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$orderDate', 
            },
          },
          orderCount: { $sum: 1 }, 
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return orderCountData;
  } catch (error) {
    throw error; 
  }
}

  async function calculateProductsCount() {
    try {
      const productCount = await Product.countDocuments();
  
      return productCount;
    } catch (error) {
      throw error; 
    }
 }


async function calculateOnlineOrderCountAndTotal() {
  try {
    const onlineOrderData = await Order.aggregate([
      {
        $match: {
          paymentMethod: 'online', 
          orderStatus: 'Delivered', 
        },
      },
      {
        $group: {
          _id: null,
          totalPriceSum: { $sum: '$totalprice' }, 
          count: { $sum: 1 },
        },
      },
    ]);

    return onlineOrderData;
  } catch (error) {
    throw error; 
  }
}


async function calculateCodOrderCountAndTotal() {
  try {
    const codOrderData = await Order.aggregate([
      {
        $match: {
          paymentMethod: 'cod', 
          orderStatus: 'Delivered', 
        },
      },
      {
        $group: {
          _id: null,
          totalPriceSum: { $sum: '$totalprice' }, 
          count: { $sum: 1 },
        },
      },
    ]);

    return codOrderData;
  } catch (error) {
    throw error; 
  }
}


async function getLatestOrders() {
  try {
    const latestOrders = await Order.aggregate([
      {
        $unwind: '$products',
      },
      {
        $sort: {
          date: -1, 
        },
      },
      {
        $limit: 10, 
      },
    ]);

    return latestOrders;
  } catch (error) {
    throw error; 
  }
}


async function calculateListedCategoryCount() {
  try {
    const listedCategoryCount = await Category.countDocuments({ isListed: true });

    return listedCategoryCount;
  } catch (error) {
    throw error; 
  }
}



const getDashboard =async (req,res)=>{
    try {
      
      const ordersData= await calculateDeliveredOrderTotal()
      console.log(ordersData);
      const orders = ordersData[0]
       const categorySales =await calculateCategorySales() 
       const salesData = await calculateDailySales() 
        const salesCount = await calculateOrderCountByDate()
       const categoryCount  = await calculateListedCategoryCount()
       const productsCount  = await calculateProductsCount()
       const onlinePay = await calculateOnlineOrderCountAndTotal()
       const codPay = await calculateCodOrderCountAndTotal()
       const latestorders = await  getLatestOrders()
    
    //    console.log(ordersData,"get dashBorde rsData")
    //  console.log(orders,"get dashBordorders")
    //    console.log(categorySales,"get dashBorders categorySales")
    //    console.log(salesData,"get dashBorders  salesData")
      //  console.log(salesCount,"get dashBordersData salesCount")
      //  console.log(categoryCount ,"get dashBorders categoryCount ")
      //  console.log(productsCount,"get dashBorders productsCount")
      //  console.log(onlinePay,"get dashBord onlinePay")
      //  console.log(codPay,"get dashBord codPay")
      //  console.log(latestorders,"get dashBord latestorders")
      //  console.log("productsCount:", productsCount);
      //  console.log("categoryCount:", categoryCount);
      console.log("onlinePay.totalPriceSum:", onlinePay[0].totalPriceSum);
      console.log("onlinePay.count:", onlinePay[0].count);
      
       
       res.render('admin/adminDashboard',{orders,productsCount,categoryCount,
            onlinePay:onlinePay[0],salesData,order:latestorders,salesCount,
            codPay:codPay[0],categorySales})
      
    }
     catch (error) {
      console.log(error.message)
    }
    
    }

    async function getOrderById(orderId) {
      try {
        const order = await Order.findById(orderId)
          .populate('products.productId');
        return order;
      } catch (error) {
        throw error;
      }
    }

    const getOrderInvoice = async (req,res)=>{
      // let result;
      try {
        const id = req.query.orderId
      
        const userId = req.session.userId;
      
         result = await getOrderById(id);
       
        const date = result.orderDate.toLocaleDateString();
        const product = result.products;
        // console.log(result,"inv2");
    
        const order = {
          id: id,
          total:parseInt( result.totalprice),
          date: date,
          payment: result.paymentMethod,
          name: result.address.name,
          address: result.address.address,
          tel: result.address.tel,
          city: result.address.city,
          state: result.address.state,
          pincode: result.address.pincode,
          product: result.products,
        };
       
    
        const products = order.product.map((product) => ({
          "quantity":parseInt( product.quantity),
          "description": product.productId.productname,
          "tax-rate":0,
          "price": parseInt(product.productId.productprice),
        }));
    
        console.log(products,"inv2");
    
      
        let data = {
          customize: {},
          images: {
            // logo: "https://public.easyinvoice.cloud/img/logo_en_original.png",
    
            background: "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
          },
    
    
          sender: {
            company: "Noizz",
            address: "Brototype",
            zip: "686633",
            city: "Maradu",
            country: "India",
          },
    
          client: {
            company: order.name,
            address: order.street,
            zip: order.pincode,
            city: order.city,
            // state:" <%=order.state%>",
            country: "India",
          },
          information: {
            number: order._id,
    
            date: order.orderDate,
            // Invoice due date
            "due-date": "Nil",
          },
    
          products: products,
          // The message you would like to display on the bottom of your invoice
          "bottom-notice": "Thank you,Keep shopping.",
        };
         result= Object.values(result)
        
      
        
          easyinvoice.createInvoice(data, async  (result)=> {
            //The response will contain a base64 encoded PDF file
            console.log(result,"jjj11",data,"pdf11");
            if (result && result.pdf) {
              await fs.writeFileSync("invoice.pdf", result.pdf, "base64");
          
            
      
      
             // Set the response headers for downloading the file
             res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
             res.setHeader('Content-Type', 'application/pdf');
       
             // Create a readable stream from the PDF base64 string
             const pdfStream = new Readable();
             pdfStream.push(Buffer.from(result.pdf, 'base64'));
             pdfStream.push(null);
       
             // Pipe the stream to the response
             pdfStream.pipe(res);
            }else {
              // Handle the case where result.pdf is undefined or empty
              res.status(500).send("Error generating the invoice");
            }
      
            
          }).catch((err)=>{
            console.log(err,"errrrrrr")
          })
       
       
      } catch (error) {
        console.log(error)
      }
    }
module.exports = {
    orderDetails,
    orderList,
    cancelOrder,
    returnOrder,
    orderManagement,
    orderDetailView,
    updateStatus,
    walletDispaly,
    getDashboard,
    getOrderInvoice
  
}