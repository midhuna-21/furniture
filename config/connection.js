const mongoose = require('mongoose');

const connectDB = () =>{
    return mongoose.connect('mongodb://127.0.0.1:27017/Store', {
        useNewUrlParser : true,
        useUnifiedTopology: true,
    })
    .then(() =>{
        console.log("mongodb connected");
    })
    .catch((err) =>{
        console.log("monogodb connection error:", err);
    })
}

module.exports = connectDB;