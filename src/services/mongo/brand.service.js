const { brand, brandCategories } = require("../../database/mongo/models");
const { statusCodes, messages } = require("../../configs");

const mongoose = require('mongoose');
/**
 * Service class for brand-related operations
 */
class BrandService { }

/**
 * Create a brand
 * @param {Object} body - The brand data to be created
 * @returns {Object|boolean} - The created brand data or false if creation fails
 * @throws {Error} - If an error occurs during the process
 */
BrandService.createBrand = async (body) => {
  try {
    let brandData = await brand.create(body); // Create a new brand in the database
    console.log("🚀 ~ file: brand.service.js:19 ~ BrandService.createBrand= ~ Brand:", brandData)
    if (!brandData) return false;
    return {
      code: statusCodes.HTTP_OK,
      data: brandData,
      message: messages.brandCreated
    };
  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
};

/**
 * Get a list of brands by user ID
 * @param {string} id - The user ID
 * @returns {Object|boolean} - The list of brands or false if retrieval fails
 * @throws {Error} - If an error occurs during the process
 */
BrandService.getBrandsListByUserId = async (id) => {
  try {
    let brandList = await brand.find({ user_id: mongoose.Types.ObjectId(id) }).sort({ addedAt: -1 }); // Retrieve brands based on user ID
    console.log("🚀 ~ file: brand.service.js:43 ~ BrandService.getBrandsListByUserId= ~ BrandList:", brandList)
    if (!brandList) return false;
    return {
      code: statusCodes.HTTP_OK,
      data: brandList,
      message: messages.brandDataFetchedSuccessFully
    };
  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
};


BrandService.getCreatorsUnderBrandCampaigns = async (id) => {
  try {
    return await brand.aggregate([
      {
        $match: {
          user_id: mongoose.Types.ObjectId(id)
        }
      },
      {
        $lookup: {
          from: 'campaigns', // Collection name for campaigns
          localField: '_id', // Field in the brand collection
          foreignField: 'brandId', // Field in the campaign collection
          as: 'campaigns'
        }
      },
      {
        $project: {
          brand_name: 1,
          brand_manager: 1,
          brand_primary_category: 1,
          brand_secondary_category: 1,
          brand_logo: 1,
          campaigns: '$campaigns._id' // Only include the _id field from the campaigns array
        }
      },
      {
        $lookup: {
          from: 'shortlistcreators', // Collection name for shortlistcreators
          let: { campaignIds: '$campaigns' }, // Pass campaigns array as a variable
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$campaignId', '$$campaignIds'] }
              }
            }
          ],
          as: 'shortlistcreators'
        }
      },
      {
        $unwind: { path: '$shortlistcreators', preserveNullAndEmptyArrays: true } // Preserve null and empty arrays
      },
      {
        $project: {
          brand_name: 1,
          brand_manager: 1,
          brand_primary_category: 1,
          brand_secondary_category: 1,
          brand_logo: 1,
          instagram_creators: { $ifNull: ['$shortlistcreators.instagram_creators', []] },
          youtube_creators: { $ifNull: ['$shortlistcreators.youtube_creators', []] },
          facebook_creators: { $ifNull: ['$shortlistcreators.facebook_creators', []] }
        }
      },
      {
        $sort: { 'addedAt': -1 }
      }
    ])

  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
};

BrandService.getBrandsListByUserIdWithCreatorCount = async (id) => {
  try {
    return await brand.aggregate([
      {
        $match: {
          user_id: mongoose.Types.ObjectId(id)// Replace with the actual user_id
        }
      },
      {
        $lookup: {
          from: "campaigns",
          localField: "_id",
          foreignField: "brandId",
          as: "campaigns"
        }
      },
      {
        $lookup: {
          from: "shortlistcreators",
          localField: "_id",
          foreignField: "brandId",
          as: "shortlists"
        }
      },
      {
        $addFields: {
          uniqueCreators: {
            $reduce: {
              input: "$shortlists",
              initialValue: [],
              in: { $setUnion: ["$$value", "$$this.creators"] }
            }
          }
        }
      },
      {
        $addFields: {
          creatorsCount: { $size: "$uniqueCreators" }
        }
      },
      {
        $project: {
          _id: 0,
          brandDetails: "$$ROOT",
          creatorsCount: 1,
          // campaigns: 1  // This is use for later point of time to get campaign Details
        }
      },
      {
        $sort: {
          "brandDetails.addedAt": -1,
        }
      }
    ]);
  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
};




/**
 * Find a brand by brand name and user ID
 * @param {string} brandName - The brand name
 * @param {string} uId - The user ID
 * @returns {Object|boolean} - The found brand data or false if not found
 * @throws {Error} - If an error occurs during the process
 */
BrandService.findBrandByIdAndName = async (brandName, uId) => {
  try {
    let brandList = await brand.find({ user_id: mongoose.Types.ObjectId(uId), brand_name: brandName }); // Find a brand by brand name and user ID
    console.log("🚀 ~ file: brand.service.js:66 ~ BrandService.findBrandByIdAndName= ~ BrandList:", brandList)
    if (brandList.length === 0) return false;
    return {
      code: statusCodes.HTTP_OK,
      data: brandList,
      message: messages.brandDataFetchedSuccessFully
    };
  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
};

/**
 * Get all brand categories
 * @returns {Object|boolean} - The list of brand categories or false if retrieval fails
 * @throws {Error} - If an error occurs during the process
 */
BrandService.getAllBrandCategories = async () => {
  try {
    let brandCategoriesList = await brandCategories.find(); // Retrieve all brand categories
    console.log("🚀 ~ file: brand.service.js:87 ~ BrandService.getAllBrandCategories= ~ BrandList:", brandCategoriesList)
    if (!brandCategoriesList) return false;
    return {
      code: statusCodes.HTTP_OK,
      data: brandCategoriesList,
      message: messages.brandDataFetchedSuccessFully
    };
  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
};


// Define the method to get brand names by company ID
BrandService.getBrandNamesByCompanyIdWithPagination = async (user_id) => {

  try {
    // Query the brand collection to get the brand names associated with the given user_id
    const brandDocs = await brand.find({ user_id: mongoose.Types.ObjectId(user_id)}, {brand_name: 1, _id: 1});

    return brandDocs;
  } catch (err) {
    throw new Error(err);
  }
};






// SPRINT5.0

BrandService.updateBrand = async (_id, updateData) => {
  try {
    return await await brand.findByIdAndUpdate({ _id }, updateData, { new: true });
  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
};

BrandService.getBrand = async (filter) => {
  try {
    return  await brand.find(filter);
  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
};
module.exports = BrandService;
