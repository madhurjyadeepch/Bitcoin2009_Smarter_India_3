const User = require("./../models/userModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./factoryHandler");
const appError = require("./../utils/appError");
const multer = require("multer");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/users");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(
      new appError("Not an image! Please upload only images", 400),
      false
    );
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single("photo");

const filterBody = (bodyObj, ...allowedFields) => {
  const newObj = {};

  Object.keys(bodyObj).forEach((element) => {
    if (allowedFields.includes(element)) newObj[element] = bodyObj[element];
  });

  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  // 1) create error if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new appError(
        "This route is not for password update. Please use /updatePassword.",
        400
      )
    );
  }

  const filterObj = filterBody(req.body, "name", "email");

  if (req.file) filterObj.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterObj, {
    new: true,
    runValidator: true,
  });

  //2)update user data

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const deletedUser = await User.findByIdAndUpdate(req.user.id, {
    active: false,
  });

  res.status(204).json({
    status: "success",
    user: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
