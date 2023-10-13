const mongoose = require('mongoose');
const session = require('express-session')
const User = require('../models/userModel')
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
        res.render('/error')
    }
}
const orderList = async (req, res) => {
  try {
      const products = await Product.find();
      const userId = req.session.user_id;
      const user = await User.findById(userId);

      const perPage = 6; 
      const page = parseInt(req.query.page) || 1;

      const orderCount = await Order.countDocuments({ user: userId });
      const totalPages = Math.ceil(orderCount / perPage);

      const orders = await Order.find({ user: userId })
          .populate('products.productId')
          .sort({ orderDate: -1 }) 
          .skip((page - 1) * perPage)
          .limit(perPage);

      const formattedOrders = orders.map(order => ({
          ...order.toObject(),
          formattedOrderDate: order.orderDate.toLocaleDateString()
      }));

      res.render('users/orderlist', {
          order: formattedOrders,
          user,
          products,
          currentPage: page,
          totalPages: totalPages
      });
  } catch (error) {
      res.render('/error')
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
        const currentDate = new Date();
        const orderDate = order.orderDate;
        const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));

        if (daysDifference > 10) {
            return res.status(400).json({ message: 'Cannot cancel an order placed for more than 10 days' });
        }

        if (order.paymentMethod !== 'cod') {
          const canceledAmount = order.totalprice;
          const userId = order.user;
          const transactionType = 'credit';
          await walletHelper.updateWalletBalance(userId, canceledAmount, transactionType);
      }

        order.orderStatus = 'Cancelled';
        await order.save();

        return res.json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const returnOrder = async (req, res) => {
  try {
      const { orderId ,selectedReason } = req.body;
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      if (order.orderStatus !== 'Delivered') {
        return res.status(400).json({ error: 'NotDelivered' });
      }
      
      if (daysDifference > 10) {
        return res.json({ error: 'Over10Days' });
      }

      const currentDate = new Date();
      const orderDate = order.orderDate;
      const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));

      if (daysDifference > 10) {
          return res.json({ message: 'Cannot return an order placed for more than 10 days' });
      }

      order.orderStatus = 'Returned'; 
      order.reasonResponse = selectedReason;
      await order.save();

      return res.json({ success: true});
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
  }
};


const orderManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 10;


    const skipp = (page - 1) * itemsPerPage;

    const orders = await Order.find()
      .sort({ orderDate: -1 }) 
      .skip(skipp)
      .limit(itemsPerPage)
      .populate('products.productId user');
     

    const totalOrders = await Order.countDocuments();

    const formattedOrders = orders.map((order) => {
      return {
        ...order.toObject(),
        formattedOrderDate: order.orderDate.toLocaleDateString(),
      };
    });

    const totalPages = Math.ceil(totalOrders / itemsPerPage);

    res.render('admin/orderManagement', {
      orders: formattedOrders,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};



const orderDetailView = async(req, res)=>{
   
    try{
        const orderId = req.params.orderId;
        const orders = await Order.findById(orderId).populate('products.productId user');
        
        res.render('admin/orderDetail',{orders: [orders]})
    }catch(error){
       res.render('/error')
    }
}
const updateStatus = async(req, res)=>{
    try{
       
        const { orderId } = req.params;
        const { newStatus } = req.body;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        if (order.orderStatus === 'Delivered') {
          return res.status(400).json({ message: 'Order is already delivered' });
      }
        if (order.orderStatus === 'Cancelled') {
            return res.status(400).json({ message: 'Order is already canceled' });
        }
        order.orderStatus = newStatus;

        if (newStatus === 'Delivered') {
          order.delivered = {
              deliveredDate: new Date(),
          };
        }
        await order.save();

        res.json({ success:true });

    }catch(error){
        res.render('/error')
    }
}
const walletDispaly = async(req, res)=>{
    try{
            const userId = req.session.user_id; 
    
            const wallet = await Wallet.findOne({ userId });
           
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
        totalPriceSum: 0, 
        count: 0, 
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
      {
        $lookup: {
          from: 'users', 
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $addFields: {
          username: {
            $arrayElemAt: ['$userDetails.name', 0],
          },
          address: {
            $arrayElemAt: ['$userDetails.address.name', 0], 
          },
        },
      },
      {
        $project: {
          userDetails: 0, 
        },
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
    //    console.log(salesCount,"get dashBordersData salesCount")
    //    console.log(categoryCount ,"get dashBorders categoryCount ")
    //    console.log(productsCount,"get dashBorders productsCount")
    //    console.log(onlinePay,"get dashBord onlinePay")
    //    console.log(codPay,"get dashBord codPay")
    //    console.log(latestorders,"get dashBord latestorders")
    //    console.log("productsCount:", productsCount);
    //    console.log("categoryCount:", categoryCount);
    //   console.log("onlinePay.totalPriceSum:", onlinePay[0].totalPriceSum);
    //   console.log("onlinePay.count:", onlinePay[0].count);
      console.log('uasername',latestorders)
       
       res.render('admin/adminDashboard',{orders,productsCount,categoryCount,
            onlinePay:onlinePay[0],salesData,order:latestorders,salesCount,
            codPay:codPay[0],categorySales})
      
    }
     catch (error) {
      res.render('/error')
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
    
      try {
        const id = req.query.orderId
      
        const userId = req.session.userId;
      
         result = await getOrderById(id);
       
        const date = result.orderDate.toLocaleDateString();
        const product = result.products;
        
    
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
            company: "Halang",
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
        res.render('/error')
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
    getOrderInvoice,  
}