const { connect } = require("mongoose");
const AppError = require("./../utils/appError");

const handleDuplicateFieldsDB = (err) => {
  const fieldValue = err.keyValue.name;
  const message = `Duplicate field value "${fieldValue}". Please use another value`;

  return new AppError(message, 400);
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError("Invalid token.Please log in again", 401);

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input. ${errors.join(", ")}`;

  return new AppError(message, 400);
};

const handleJWTExpirationError = () => {
  return new AppError("Token is expired. Please login again", 401);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //Operational, true
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // console.error('Error!', err);

    res.status(500).json({
      status: "fail",
      message: "Something went very wrong!",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    if (err.name === "CastError") {
      error = handleCastErrorDB(err);
    }

    if (err.code === 11000) {
      error = handleDuplicateFieldsDB(err);
    }

    if (err.name === "ValidationError") error = handleValidationErrorDB(err);

    if (err.name === "JsonWebTokenError") error = handleJWTError(err);

    if (err.name === "TokenExpiredError") error = handleJWTExpirationError(err);

    sendErrorProd(error, res);
    // console.log(err);
  }
};
