const {
  user,
  userVerifyToken,
  userSession,
  otp: OTPmodel,
  staticRolesPrivileges,
  restricted_domains,
  campaignRequest,
} = require("../../database/mongo/models");
const { statusCodes, messages, thirdpartyConfig } = require("./../../configs");
const {
  OTPGenerator,
  genHash,
  generateAccessToken,
  comparePassword,
} = require("./../../utils");
const {
  USER_ROLE_TYPE,
  USER_STATUS,
  TOKEN_TYPE,
  SESSION_STATUS,
} = require("./../../constants");
const moment = require("moment-timezone");
const sendSms = require("../../helpers/sendSms");
const CampaignService = require("./campaign.service");
const BrandService = require("./brand.service");
const { campaignModel } = require("../../database/mongo/models/campaign.model");
const brandModel = require("../../database/mongo/models/brand.model");
const campaignRequestModel = require("../../database/mongo/models/campaignRequest.model");

class UserService { }

UserService.getUserById = async (id) => {
  try {
    const data = await user.findById(id, {
      password: 0,
      __v: 0,
      createdAt: 0,
      updatedAt: 0,
    });
    if (!user) {
      throw new Error("User not found");
    }

    return {
      code: statusCodes.HTTP_OK,
      message: "User details",
      data,
    };
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
};

UserService.findUserByEmail = async (email) => {
  try {
    const userdata = await user.findOne({ companyMailId: email });

    if (!userdata) {
      return null;
    }
    return {
      code: statusCodes.HTTP_OK,
      message: "User",
      data: userdata,
    };
  } catch (e) {
    throw new Error(e);
  }
};

UserService.isDomainRestricted = async (emailDomain) => {
  try {
    // Check if the provided email domain exists in the restricted domains collection
    const restrictedDomain = await restricted_domains.findOne({
      restrictedDomain: emailDomain,
    });

    return !!restrictedDomain; // Return true if it's a restricted domain, false otherwise
  } catch (err) {
    throw new Error(err);
  }
};

UserService.findUserByEmailOrMobile = async (email, mobile) => {
  try {
    const userdata = await user.findOne({
      $or: [{ companyMailId: email }, { mobileNumber: mobile }],
    });

    if (!userdata) {
      return null;
    }
    return {
      code: statusCodes.HTTP_OK,
      message: "User",
      data: userdata,
    };
  } catch (e) {
    throw new Error(e);
  }
};

UserService.signUp = async (payload) => {
  try {
    if (payload.password) {
      payload.password = genHash(payload.password);
    }

    let userData = new user(payload);
    let data = await userData.save();
    delete data.password;

    if (!data) {
      return {
        code: statusCodes.HTTP_INTERNAL_SERVER_ERROR,
        message: messages.userNotCreate,
      };
    }

    data = JSON.parse(JSON.stringify(data));

    return {
      code: statusCodes.HTTP_CREATED,
      message: messages.userRegistered,
      data,
    };
  } catch (err) {
    throw new Error(err);
  }
};

UserService.createVerifyToken = async (userid, token) => {
  try {
    const endTime = moment().add(28, "days").utc().format();
    const saveToken = new userVerifyToken({
      userid: userid,
      token: token,
      endTime: endTime,
    });
    const data = await saveToken.save();
    if (!data) {
      return {
        code: statusCodes.HTTP_INTERNAL_SERVER_ERROR,
        message: messages.tokenNotSaved,
      };
    } else {
      return {
        code: statusCodes.HTTP_CREATED,
        message: messages.tokenSaved,
        data,
      };
    }
  } catch (err) {
    {
      return {
        code: statusCodes.HTTP_INTERNAL_SERVER_ERROR,
        message: messages.tokenNotSaved,
      };
    }
  }
};

UserService.getVerifyToken = async (token) => {
  try {
    const tokendata = await userVerifyToken.findOne({ token: token });
    if (!tokendata) {
      return null;
    }
    return {
      code: statusCodes.HTTP_OK,
      message: "token",
      data: tokendata,
    };
  } catch (e) {
    throw new Error(e);
  }
};

UserService.updateStatus = async (userid) => {
  try {
    const updateUser = await user.updateOne(
      { _id: userid },
      { status: USER_STATUS.ACTIVE }
    );
    if (updateUser && updateUser.ok) {
      return {
        code: statusCodes.HTTP_OK,
        message: messages.userVerified,
      };
    } else {
      return {
        code: statusCodes.HTTP_INTERNAL_SERVER_ERROR,
        message: messages.userNotVerified,
      };
    }
  } catch (e) { }
};

UserService.deleteVerifyToken = async (id) => {
  await userVerifyToken.deleteOne({ _id: id });
};

UserService.getSessionData = async (_id) => {
  try {
    return await userSession.findOne({ _id, status: SESSION_STATUS.ACTIVE });
  } catch (err) {
    throw new Error(err);
  }
};

UserService.getSessionByUserId = async (userId) => {
  try {
    return await userSession.findOne({ userId });
  } catch (err) {
    throw new Error(err);
  }
};

UserService.createSession = async (data) => {
  try {
    let count = await userSession.countDocuments({
      userId: data?.userId,
      status: SESSION_STATUS.ACTIVE,
    });
    if (count >= thirdpartyConfig.SESSION_LIMIT) {
      const updateQuery = {
        $set: {
          status: SESSION_STATUS.INACTIVE,
        },
      };

      const options = {
        sort: {
          loginDateTime: 1, // Sort in ascending order of loginDateTime
        },
        returnOriginal: false, // This option specifies that you want the updated document to be returned, not the original one.
      };
      const deletesession = await userSession.findOneAndUpdate(
        { userId: data?.userId, status: SESSION_STATUS.ACTIVE },
        updateQuery,
        options
      );

      if (!deletesession) {
        return false;
      }
    }
    return await userSession.create(data);
  } catch (err) {
    throw new Error(err);
  }
};

UserService.loginWithPassword = async (body) => {
  try {
    const { companyMailId, password } = body;

    const findUser = await user.findOne(
      {
        companyMailId: companyMailId,
        status: { $eq: USER_STATUS.ACTIVE },
      },
      { __v: 0 }
    );

    if (!findUser) {
      return {
        code: statusCodes.HTTP_NOT_FOUND,
        message: messages.userNotExist,
      };
    }
    const compare = await comparePassword(password, findUser?.password);
    if (!compare) {
      return {
        code: statusCodes.HTTP_CONFLICT,
        message: messages.incorrectPassword,
      };
    }

    data = JSON.parse(JSON.stringify(findUser));
    delete data.password;
    const getSessionbyUser = await UserService.getSessionByUserId(data?._id);
    data.firstLogin = 0;
    if (!getSessionbyUser) {
      data.firstLogin = 1;
    }
    const sessionData = await UserService.createSession({
      userId: data?._id,
      tokenType: TOKEN_TYPE.JWT,
      status: SESSION_STATUS.ACTIVE,
      firstLogin: data?.firstLogin,
      logInDateTime: moment(new Date()),
    });
    if (!sessionData) {
      return {
        code: statusCodes.HTTP_CONFLICT,
        message: messages.sessionExceeded,
      };
    }

    // static Role check for operationAdmin // later flow may change in different
    const animetaOperationTeamRoles = await staticRolesPrivileges.findOne({ role: USER_ROLE_TYPE.ANIMETA_ADMIN, currentAdmins: { $in: companyMailId.toLowerCase() } })
    // console.log(animetaOperationTeamRoles)
    let role;
    let privilege;
    if (animetaOperationTeamRoles) {
      const rolesPrivileges = JSON.parse(JSON.stringify(animetaOperationTeamRoles))
      role = rolesPrivileges.role;
      privilege = rolesPrivileges.privilege

    }


    data.token = generateAccessToken({
      id: data?._id,
      sessionId: sessionData?._id,
      firstLogin: data?.firstLogin,
      companyMailId: data?.companyMailId,
      name: data?.name,
      lastName: data?.lastName,
      companyName: data?.companyName,
      role: role ? role : 'NA',
      privilege: privilege ? privilege : {}
    });
    sessionData.accessToken = data?.token;
    sessionData.save();
    /**
     *  Return to controller
     */
    return {
      code: statusCodes.HTTP_OK,
      message: messages.loginSuccess,
      data,
    };
  } catch (err) {
    throw new Error(err);
  }
};

UserService.logout = async (_id) => {
  try {
    const logoutSession = await userSession.findOneAndUpdate(
      { _id },
      { status: SESSION_STATUS.INACTIVE, logoutDateTime: moment(new Date()) },
      { new: true }
    );
    if (!logoutSession)
      return {
        code: statusCodes.HTTP_CONFLICT,
        message: messages.invalidSession,
      };
    return {
      code: statusCodes.HTTP_OK,
      message: messages.logoutSuccess,
    };
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
};

UserService.sendOTP = async (mobileNumber, countryCode) => {
  try {
    const OTP = OTPGenerator();

    let payload = {
      mobileNumber,
      otp: OTP,
    };

    const saveOTP = await OTPmodel.create(payload);
    if (!saveOTP) {
      throw new Error(messages["500"]);
    }
    const message = `Your OTP is ${OTP}. Please do not share it with anyone.`;
    sendSms(message, countryCode + mobileNumber);

    return {
      code: statusCodes.HTTP_OK,
      message: messages.otpSend,
    };
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
};

UserService.getOTP = async (mobileNumber, otp) => {
  try {
    return await OTPmodel.findOne({
      mobileNumber,
      otp,
      isUsed: { $eq: false },
    });
  } catch (err) {
    throw new Error(err);
  }
};

UserService.updateOtpUsed = async (_id) => {
  try {
    return await OTPmodel.findOneAndUpdate({ _id }, { isUsed: true });
  } catch (err) {
    throw new Error(err);
  }
};

UserService.updatePassword = async (_id, newpassword) => {
  try {
    const password = genHash(newpassword);
    return await user.findOneAndUpdate({ _id }, { password });
  } catch (err) {
    throw new Error(err);
  }
};

UserService.updateSessionDELETED = async (accessToken) => {
  try {
    await userSession.findOneAndUpdate(
      { accessToken },
      { status: USER_STATUS.DELETED }
    );
  } catch (err) {
    throw new Error(err);
  }
};

UserService.getAccounts = async (filter, sort, limit, offset) => {
  try {
    return await user.find(filter, { password: 0, updatedAt: 0, __v: 0 })
      .sort(sort)
      .limit(limit)
      .skip(offset);
  } catch (err) {
    throw new Error(err);
  }

}

UserService.getCountOfUsers = async (filter) => {
  try {
    return await user.countDocuments(filter);
  } catch (err) {
    throw new Error(err);
  }
}

UserService.updateUserById = async (_id, update) => {
  try {
    const options = { upsert: true, new: true };
    return await user.findOneAndUpdate({ _id }, update, options)
  } catch (err) {
    throw new Error(err)
  }
}

UserService.getCompanyNamesByUserIdWithPagination = async (filter, limit, offset) => {
  try {
    const [ companyNames] = await Promise.all([

      user.find(filter, { companyName: 1 })
          .sort({ createdAt: -1 }) // Sort by createdAt field in descending order (latest first)
          .skip(offset)
          .limit(limit)
    ]);

    return { companyNames };
  } catch (err) {
    throw new Error(err);
  }
};


module.exports = UserService;
