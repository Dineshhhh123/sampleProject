const { creators, creatorV2, creatorSchemaTaxonomy, creatorOnboarding } = require("../../database/mongo/models");
const { statusCodes, messages, thirdpartyConfig } = require("./../../configs");
const { OTPGenerator, genHash, generateAccessToken, comparePassword } = require("./../../utils");
const { OTP_TYPE, USER_STATUS, TOKEN_TYPE, SESSION_STATUS } = require('./../../constants')
const moment = require('moment-timezone');
const _ = require("lodash");
const getPagingData = require('../../utils/pagination');
const { GcpUploadHandler } = require('../../middleware/gcpUploadHandler');
const creatorSchemaTaxonomyModel = require("../../database/mongo/models/creatorSchemaTaxonomy.model");
const xlsx = require('xlsx');

class CreatorOnboarding {}

CreatorOnboarding.createCreator = async (body) => {
    try {
        let creator = await creatorV2.create(body);
        console.log("🚀 ~ file: creator.service.js:12 ~ CreatorOnboarding.createCreator= ~ creator:", creator)
        if (!creator) return false;
        return {
            code: statusCodes.HTTP_OK,
            data: creator,
            message: messages.creatorCreated
        }
    } catch (err){
        console.log("err", err);
        throw new Error(err);
    }
}
CreatorOnboarding.ValidateEmail = async (emailId) => {
    try {
        console.log("🚀 ~ file: creator.service.js:27 ~ CreatorOnboarding.createCreator= ~ body:", emailId);
        let checkCreatorCreated = await creatorOnboarding.find({email: emailId })
        if (checkCreatorCreated.length > 0) {
            return {
                code: statusCodes.HTTP_CONFLICT,
                message: messages.creatorEmailAlreadyExists
            }
        }
        return {
            code: statusCodes.HTTP_OK,
            message: messages.creatorAvailableToCreated
        }
    } catch (err) {
        console.log("err", err);
        throw new Error(err);
    }
};
CreatorOnboarding.ValidateMobile = async (mobile) => {
    try {
        console.log("🚀 ~ file: creator.service.js:27 ~ CreatorOnboarding.createCreator= ~ body:", mobile);
        let checkCreatorCreated = await creatorOnboarding.find({mobileNumber: mobile })
        if (checkCreatorCreated.length > 0) {
            return {
                code: statusCodes.HTTP_CONFLICT,
                message: messages.creatorMobileAlreadyExists
            }
        }
        return {
            code: statusCodes.HTTP_OK,
            message: messages.creatorAvailableToCreated
        }
    } catch (err) {
        console.log("err", err);
        throw new Error(err);
    }
};
CreatorOnboarding.createOnboarding = async (body) => {
    try {
        console.log("🚀 ~ file: creator.service.js:27 ~ CreatorOnboarding.createCreator= ~ body:", body);
        // let checkCreatorCreated = await creatorOnboarding.find({
        //     $or: [
        //         { email: body.email },
        //         { mobileNumber: body.mobileNumber }
        //     ]
        // })
        // if (checkCreatorCreated.length > 0) {
        //     return {
        //         code: statusCodes.HTTP_CONFLICT,
        //         message: messages.creatorAlreadyCreated
        //     }
        // }
        let creator = await creatorOnboarding.create(body);
        console.log("🚀 ~ file: creator.service.js:42 ~ CreatorOnboarding.createCreator= ~ creator:", creator);
        if (!creator) return false;
        return {
            code: statusCodes.HTTP_OK,
            data: creator,
            message: messages.creatorOnboardingSuccessful
        }
    } catch (err){
        console.log("err", err);
        throw new Error(err);
    }
}

CreatorOnboarding.handleDocumentUpload = async (body) => {
    try {
        console.log("🚀 ~ file: creator.service.js:27 ~ CreatorOnboarding.createCreator= ~ body:", body);
        const keyFilename = process.env.gcloudKey;
        const bucketName = process.env.campaignStorage;
        const fileBuffer = req.file.buffer;
        const destinationFileName = req.file.originalname;
        const filePath = `./${destinationFileName}`;
        const publicUrl = await GcpUploadHandler.uploadFileToGcp(bucketName, filePath, destinationFileName, process.env.GOOGLE_APPLICATION_CREDENTIALS);
        return {
            code: statusCodes.HTTP_OK,
            data: publicUrl,
            message: messages.documentUploadSuccessful
        }
    } catch (err){
        console.log("err", err);
        throw new Error(err);
    }
}

CreatorOnboarding.updateConsentStatus = async (body) => {
    try {
        if (!body._id)  return {
            code: statusCodes.HTTP_CONFLICT,
            message: messages.creatorIdRequired
        }
        let updateConsent = await creatorOnboarding.findByIdAndUpdate({ _id: body._id }, { $set: { notifyMe: body.notifyMe, representMe: body.representMe } }, { new: true });
        if (!updateConsent) return false;
        return {
            code: statusCodes.HTTP_OK,
            data: updateConsent,
            message: messages.creatorConsentUpdated
        }
    } catch (err) {
        console.log("err", err);
        throw new Error(err);
    }
}

module.exports = CreatorOnboarding;
