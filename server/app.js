const express = require("express");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const userRouter = require("./routes/userRoutes");
const reportRouter = require("./routes/reportRoutes");
const commentRouter = require("./routes/commentRoutes");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

app.use("/api/v1/reports", reportRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/comments", commentRouter);

app.use(globalErrorHandler);
module.exports = app;
