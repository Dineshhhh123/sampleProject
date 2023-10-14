const Joi = require("joi");
const JoiDate = Joi.extend(require("@joi/date"));
const { COUNTRY_CODE } = require("./../constants");
const passwordComplexity = require("joi-password-complexity");
const { thirdpartyConfig, messages } = require("./../configs");
const mongoose = require("mongoose");
const { decrypt } = require("../utils");
const {
  Types: { ObjectId },
} = mongoose;

const signUpValidation = Joi.object({
  name: Joi.string().trim().required(),
  lastName: Joi.string().trim().optional(),
  companyMailId: Joi.string().trim().email().required().messages({
    'string.empty': 'companyMailId is required.',
    'string.email': 'Must be a valid email.',
    'any.required': 'companyMailId is required.',
  }),
  mobileNumber: Joi.string()
    .trim()
    .required()
    .length(10)
    .pattern(/^[0-9]+$/)
    .messages({
      "string.pattern.base": "mobileNumber must only contain numbers",
    }),
  companyName: Joi.string()
    .trim()
    .required(),
    

  countryCode: Joi.string()
    .trim()
    .valid(...COUNTRY_CODE)
    .optional()
    .messages({ "any.only": "Invalid Country Code" }),
  advertiserCategory: Joi.string()
    .trim()
    .optional(),
    
  password: Joi.string()
  .min(8)
  .regex(/^(?=.*[0-9])/)
  .required()
  .messages({
    'string.base': 'Password must be a string',
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least 1 number',
    'any.required': 'Password is required',
  }),
});

const userIdValidation = (req, res, next) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: messages.invalidUserId });
  }
  next();
};

const tokenValidation = (req, res, next) => {
  let token = req.params && req.params.token ? req.params.token : "";

  if (!token) {
    return res.status(400).json({ error: messages.invalidToken });
  }
  req["user"] = { id: decrypt(token) };
  next();
};

const loginValidation = Joi.object({
  companyMailId: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

const forgotpasswordValidation = Joi.object({
  companyMailId: Joi.string().trim().email().required(),
});



const resetPasswordValidator = Joi.object({
  password: Joi.string()
    .min(8)
    .regex(/^(?=.*\d).*$/)
    .required()
    .messages({
      'string.base': 'Password must be a string',
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least 1 number',
      'any.required': 'Password is required',
    }),
});



const accountValidator = Joi.object({
  page: Joi.number().required(),
  size: Joi.number().required(),
  search: Joi.string().optional(),
  sortBy:Joi.string().trim().optional(),
  sortOrder: Joi.number().optional(),
}).custom((value, helpers) => {
  if ((value.sortBy && !value.sortOrder) || (!value.sortBy && value.sortOrder)) {
    return helpers.message('"sortBy" and "sortOrder" must both be provided or omitted.');
  }
  return value;
});

module.exports = {
  signUpValidation,
  userIdValidation,
  tokenValidation,
  loginValidation,
  forgotpasswordValidation,
  resetPasswordValidator,
  accountValidator
};
