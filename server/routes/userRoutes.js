const express = require("express");
const userController = require("./../controllers/userControllers");
const authController = require("./../controllers/authControllers");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.patch("/resetPassword/:token", authController.resetPassword);

router.use(authController.protect);

router.get("/me", userController.getMe, userController.getUser);
router.patch("/updatePassword", authController.updatePassword);
router.patch(
  "/updateMe",
  authController.protect,
  userController.uploadUserPhoto,
  userController.updateMe
);
router.delete("/deleteMe", authController.protect, userController.deleteMe);

router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(userController.getAllUsers)
  .put(userController.createUser);
router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
