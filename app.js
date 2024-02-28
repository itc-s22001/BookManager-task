const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require("passport");
const session =  require("express-session");
const {config} = require("./util/auth");

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/user');
const adminRouter = require("./routes/admin");
const bookRouter = require("./routes/book");
const rentalRouter = require("./routes/rental");

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// session
app.use(session({
    secret: "WmU7moZxCF19ngUYorPpltEuJXbjz4a0Dy6a0fLhBt3nEtrI",
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 60 * 60 * 1000}
}));

// passport
app.use(passport.authenticate("session"));
app.use(config(passport));


app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/admin', adminRouter);
app.use("/book", bookRouter);
app.use("/rental", rentalRouter);

BigInt.prototype.toJSON = function () {
    return this.toString()
}


module.exports = app;
