const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const session = require("express-session");
const multer = require("multer");
const nocache = require("nocache");
const fileUpload = require("express-fileupload");
const connectDB = require("./config/connection");
const configs = require("./config/config");

const userRouter = require("./routes/userRoute");
const adminRouter = require("./routes/adminRoute");

const app = express();

app.use(
    session({
        secret: configs.sessionSecret,
        resave: false,
        saveUninitialized: false,
    })
);

// view engine setup

app.set("views", path.join(__dirname, "views"));

app.set("view engine", "ejs");

// app.use(logger("dev"));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// connect to the mongodb database
connectDB();
   
app.use("/admin", adminRouter);
app.use("/", userRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    // res.render("error");
});

app.listen(3000, () => {
    console.log("server started.");
});
