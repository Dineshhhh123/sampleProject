"use strict";
const { statusCodes, messages } = require("../configs");
const codeMsgs = require("../configs/codeMsgs");
const httpCodes = require("../configs/httpCodes");

const sendMail = require("../helpers/sendmailer");
const {
  userService,
} = require(`../services/mongo`);
const { response } = require("../middleware");
const utils = require("./../utils");
const { generateAccessToken, capitalizeFirstLetter } = require("./../utils");
const getPagingData = require("../utils/pagination");

class UserController { }

UserController.getUserById = async (req, res, next) => {
  try {
    let { params } = req;

    let result = await userService.getUserById(params.id);

    return response.success(
      req,
      res,
      result?.code || statusCodes.HTTP_OK,
      result?.data,
      result?.message
    );
  } catch (err) {
    console.log("err", err);
    next(err);
  }
};

UserController.signUp = async (req, res, next) => {
  try {
    let { body } = req;

    let payload = {
      mobileNumber: body["mobileNumber"],
      companyMailId: body["companyMailId"],
      name: body["name"],
      lastName: body["lastName"],
      countrycode: body["countryCode"],
      companyName: body["companyName"],
      advertiserCategory: body["advertiserCategory"],
      password: body["password"],
    };

    // Check if the provided email domain is in the list of restricted domains
    const emailParts = payload.companyMailId.split('@');
    const emailDomain = emailParts[1];

    const isRestrictedDomain = await userService.isDomainRestricted(emailDomain);
    if (isRestrictedDomain) {
      return response.errors(
          req,
          res,
          httpCodes.HTTP_BAD_REQUEST,
          null,
          codeMsgs.domainRestricted
      );
    }

    const isUserExists = await userService.findUserByEmailOrMobile(
      payload.companyMailId,
      payload.mobileNumber
    );
    if (isUserExists) {
      return response.errors(
        req,
        res,
        httpCodes.HTTP_CONFLICT,
        undefined,
        codeMsgs.userExist
      );
    }

    let result = await userService.signUp(payload);

    if (result && result.code == 500) {
      return result;
    }

    const encryptUserId = utils.encrypt(result.data._id);

    userService.createVerifyToken(result.data._id, encryptUserId);

    const verifyLink =
      process.env.SYSTEM_URL + "/api/v1/user/verify/" + encryptUserId;

    sendMail(
      "Brandstar <" + process.env.GMAIL_ACCOUNT + ">",
      payload.companyMailId,
      "Welcome to Animeta - Verify Your Email Address",
      "../mailTemplates/verificationMailTemplate.hbs",
      { title: capitalizeFirstLetter(payload.name), verifyLink: verifyLink, images: IMAGES }
    );



    delete result.data;
    return response.success(
      req,
      res,
      result?.code || statusCodes.HTTP_OK,
      result?.data,
      result?.message
    );
  } catch (err) {
    next(err);
  }
};

UserController.verifyUser = async (req, res, next) => {
  try {
    const token = req.params.token;

    const tokendata = await userService.getVerifyToken(token);

    if (!tokendata) {
      return response.errors(
        req,
        res,
        httpCodes.HTTP_NOT_FOUND,
        undefined,
        codeMsgs.tokenNotFound
      );
    }

    const userId = tokendata.data.userid;
    const currTime = new Date();
    const endTime = tokendata.data.endTime;

    if (currTime <= endTime) {
      const result = await userService.updateStatus(userId);
      userService.deleteVerifyToken(tokendata.data._id);
      if (!result) {
        return response.errors(
          req,
          res,
          statusCodes.HTTP_INTERNAL_SERVER_ERROR,
          undefined,
          codeMsgs["500"]
        );
      }
      return res.redirect(process.env.FE_LOGIN_URL);
    } else {
      return response.errors(
        req,
        res,
        statusCodes.HTTP_UNAUTHORIZED,
        undefined,
        codeMsgs.tokenExpired
      );
    }
  } catch (err) {
    next(err);
  }
};

UserController.loginWithPassword = async (req, res, next) => {
  try {
    let { body } = req;
    let result = await userService.loginWithPassword(body);

    return response.success(
      req,
      res,
      result?.code || statusCodes.HTTP_OK,
      result?.data,
      result?.message
    );
  } catch (err) {
    console.log("err", err);
    next(err);
  }
};

UserController.logout = async (req, res, next) => {
  try {
    if (!req?.user?.sessionId)
      return response.errors(
        req,
        res,
        statusCodes.HTTP_CONFLICT,
        undefined,
        messages.invalidSession
      );

    const result = await userService.logout(req?.user?.sessionId);
    console.log("result");
    console.log(result);
    return response.success(
      req,
      res,
      result?.code || statusCodes.HTTP_OK,
      result?.data,
      result?.message
    );
  } catch (err) {
    console.log("err", err);
    next(err);
  }
};

UserController.forgotPassword = async (req, res, next) => {
  try {
    const { companyMailId } = req?.body;
    const result = await userService.findUserByEmail(companyMailId);

    if (!result) {
      return response.errors(
        req,
        res,
        statusCodes.HTTP_NOT_FOUND,
        undefined,
        "Email doesn’t exist"
      );
    }
    const token = generateAccessToken(
      { id: result?.data?._id, skipSession: true },
      "15min"
    );
    const forgotPasswordLink = process.env.FE_RESET_PWD_URL + "/" + token;
    sendMail(
      "Brandstar <" + process.env.GMAIL_ACCOUNT + ">",
      companyMailId,
      "Reset your password",
      "../mailTemplates/forgotPasswordMailTemplate.hbs",
      { title: capitalizeFirstLetter(result.data.name), forgotPasswordLink, images: IMAGES }
    );

    return response.success(
      req,
      res,
      statusCodes.HTTP_OK,
      null,
      messages.emailSend
    );
  } catch (err) {
    next(err);
  }
};

UserController.resetPassword = async (req, res, next) => {
  try {
    const { password } = req?.body;
    const { id } = req.user;
    const updatePassword = await userService.updatePassword(id, password);
    console.log(updatePassword);
    if (!updatePassword) {
      throw new Error(messages.HTTP_INTERNAL_SERVER_ERROR);
    }
    return response.success(
      req,
      res,
      statusCodes.HTTP_OK,
      null,
      messages.passwordChanged
    );
  } catch (err) {
    next(err);
  }
};

UserController.getAccountDetails = async (req, res, next) => {
  let { page, size, sortBy, sortOrder, search } = req?.body;
  page = page ? Number(page) : 1;
  const limit = size ? Number(size) : 10;
  const offset = (page - 1) * limit;
  let sort = { createdAt: -1 };

  let filter = {}

  if (search) {
     
      if(!isNaN(search) && search.length === 10){
          filter = {mobileNumber: Number(search)}
      }else{
        filter["$or"] = [
          { name: { $regex: search, $options: "i" } },
          { companyMailId: { $regex: search, $options: "i" } },
          { companyName: { $regex: search, $options: "i" } },
        ];
      }
      
    

  }

  console.log(JSON.stringify(filter))

  const totalCounts = await userService.getCountOfUsers(filter);
  let data;
  if (!totalCounts) {
    data = getPagingData([], page, limit, totalCounts);
    return response.success(
      req,
      res,
      statusCodes.HTTP_OK,
      data,
      messages.dataFetched
    );

  }



  if(sortBy){
    sort = {[sortBy == "spoc" ? "name" : sortBy] :sortOrder};
  }

  console.log(sort)

  const userAccount = await userService.getAccounts(filter, sort, limit, offset);
 
  data = getPagingData(userAccount, page, limit, totalCounts);
  return response.success(
    req,
    res,
    statusCodes.HTTP_OK,
    data,
    messages.dataFetched
  );

}

module.exports = UserController;