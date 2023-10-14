const { campaign, campaignRequest, staticRolesPrivileges } = require("../../database/mongo/models");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const ShortListService = require('../../services/mongo/shortListCreators.service');
const axios = require("axios");
class CampaignService { }

CampaignService.getCampaign = async (query) => {
  try {
    return await campaign.campaignModel.findOne(query);
  } catch (err) {
    throw new Error(err);
  }
};

CampaignService.getAllCampaign = async (query) => {
  try {
    return await campaign.campaignModel.find(query, { _id: 1, campaignName: 1 }).sort({ createdAt: -1 });
  } catch (err) {
    throw new Error(err);
  }
};

CampaignService.getCampaignByBrandId = async (brandId) => {
  try {
    return await campaign.campaignModel
      .find({ brandId }).sort({ createdAt: -1 })
      .populate("briefDetails")
      .populate("postingDetails");
  } catch (err) {
    throw new Error(err);
  }
};

CampaignService.getCampaignListByBrandId = async (brandId, createdBy) => {
  try {
    return await campaign.campaignModel
      .find({ brandId }, { _id: 1, campaignName: 1, brandId: 1, brandName: 1 }).sort({ createdAt: -1 })
  } catch (err) {
    throw new Error(err);
  }
};

CampaignService.getCampaignById = async (_id) => {
  try {
    return await campaign.campaignModel
      .findOne({ _id })
      .populate("briefDetails")
      .populate("postingDetails");
  } catch (err) {
    throw new Error(err);
  }

}

CampaignService.createCampaign = async (data) => {
  try {
    return await campaign.campaignModel.create(data);
  } catch (err) {
    throw new Error(err);
  }
};
CampaignService.updateCampaign = async (_id, data) => {
  try {
    return await campaign.campaignModel.findOneAndUpdate({ _id }, data, {
      new: true,
    });
  } catch (err) {
    throw new Error(err);
  }
};

CampaignService.updateIdToCampaign = async (_id, data) => {
  try {
    return await campaign.campaignModel.findOneAndUpdate({ _id }, data);
  } catch (err) {
    throw new Error(err);
  }
};

CampaignService.createCampaignBriefDetails = async (data) => {
  try {
    return await campaign.campaignBriefDetailsModel.create(data);
  } catch (err) {
    throw new Error(err);
  }
};
CampaignService.updateCampaignBriefDetails = async (_id, data) => {
  try {
    return await campaign.campaignBriefDetailsModel.findOneAndUpdate(
      { _id },
      data,
      { new: true }
    );
  } catch (err) {
    throw new Error(err);
  }
};

CampaignService.createCampaignPostDetails = async (data) => {
  try {
    return await campaign.campaignPostingDetailsModel.create(data);
  } catch (err) {
    throw new Error(err);
  }
};
CampaignService.updateCampaignPostDetails = async (_id, data) => {
  try {
    return await campaign.campaignPostingDetailsModel.findOneAndUpdate(
      { _id },
      data,
      { new: true }
    );
  } catch (err) {
    throw new Error(err);
  }
};


//SPRINT5.0
CampaignService.updateCampaignByBrandId = async (brandId, data) => {
  try {
    return await campaign.campaignModel.updateMany({ brandId }, data, {
      new: true,
    });
  } catch (err) {
    throw new Error(err);
  }
};


CampaignService.getShortListUniqueCountUnderBrands = async (brandId) => {
  try {
    return await campaign.campaignModel.aggregate([
      {
        $match: {
          brandId: brandId // Match documents with the provided brandId
        }
      },
      {
        $lookup: {
          from: "shortlistcreators",
          localField: "_id",
          foreignField: "campaignId",
          as: "shortlistDetails"
        }
      },
      {
        $unwind: "$shortlistDetails" // Unwind the "shortlistDetails" array
      },
      {
        $group: {
          _id: null, // Group all documents into a single group
          allCreators: { $addToSet: "$shortlistDetails.creators" } // Accumulate all creators using addToSet
        }
      },
      {
        $project: {
          _id: 0,
          totalUniqueCreatorCount: {
            $size: {
              $reduce: {
                input: "$allCreators",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] } // Merge and get unique elements
              }
            }
          }
        }
      }

    ]);
  } catch (err) {
    throw new Error(err);
  }
};


// Service for Campaign Request Email
CampaignService.createCampaignRequestEmail = async (campaignData) => {
  try {
    const newCampaign = await campaignRequest.create(campaignData);
    return newCampaign
  } catch (err) {
    throw new Error(err);
  }
};

CampaignService.getANIOperationTeamMailIds = async (role) => {
  try {
    
    return await staticRolesPrivileges.findOne({role});
   
  } catch (err) {
    throw new Error(err);
  }
};


CampaignService.updateEmailSentStatus = async (campaignId, emailSentStatus) => {
  try {
    // Find the campaign by its _id and update the emailSent field
    const updatedCampaign = await campaign.campaignModel.findOneAndUpdate(
        { _id: campaignId },
        { emailSent: emailSentStatus },
        { new: true } // Return the updated document
    );

    if (!updatedCampaign) {
      throw new Error('Campaign not found');
    }

    return updatedCampaign;
  } catch (error) {
    throw error;
  }
};


// SPRINT 6


module.exports = CampaignService;