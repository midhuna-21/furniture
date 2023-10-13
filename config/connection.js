const mongoose = require('mongoose');


const connectDB = () =>{
    return mongoose.connect('mongodb+srv://krishnamidhuna:J6OhhW4bkrtshDG2@cluster0.mu4ufpz.mongodb.net/', {
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


