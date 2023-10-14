const { userController } = require("../../controllers/index");
const { verifyToken } = require("../../middleware");

const express = require("express");
const userRoutes = express.Router();

let validator = require("express-joi-validation").createValidator({
  passError: true,
});
const {
  signUpValidation,
  userIdValidation,
  tokenValidation,
  loginValidation,
  genereteOTPValidation,
  verifyOTPValidation,
  forgotpasswordValidation,
  resetPasswordValidator,
  accountValidator
} = require("../../validators/user.validator");
const { USER_ROLE_TYPE } = require("../../constants");
const authGuard = require("../../middleware/authGuard");

userRoutes.get(
  "/:id",
  verifyToken.validateToken,
  userIdValidation,
  userController.getUserById
);

userRoutes.get(
  "/token/isvalid",
  verifyToken.verifyToken
);

userRoutes.post(
  "/signup",
  validator.body(signUpValidation),
  userController.signUp
);
userRoutes.get("/verify/:token", tokenValidation, userController.verifyUser);

userRoutes.post(
  "/login",
  validator.body(loginValidation),
  userController.loginWithPassword
);

userRoutes.post("/logout", verifyToken.validateToken, userController.logout);


userRoutes.post(
  "/forgotpassword",
  validator.body(forgotpasswordValidation),
  userController.forgotPassword
);

userRoutes.post(
  "/resetpassword",
  verifyToken.validateTokenResetToken,
  validator.body(resetPasswordValidator),
  userController.resetPassword
);


userRoutes.post("/accounts",verifyToken.validateToken,authGuard.authenticateRole(USER_ROLE_TYPE.ANIMETA_ADMIN),  validator.body(accountValidator),  userController.getAccountDetails)

userRoutes.get("/companies/list",verifyToken.validateToken,authGuard.authenticateRole(USER_ROLE_TYPE.ANIMETA_ADMIN), userController.getBrandNamesByCompany)

module.exports = userRoutes;
