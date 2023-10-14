const { creators, creatorV2, creatorSchemaTaxonomy, brandCollaboratorImages, risingStar } = require("../../database/mongo/models");
const { statusCodes, messages, thirdpartyConfig } = require("./../../configs");
const { OTPGenerator, genHash, generateAccessToken, comparePassword, roundToNearest } = require("./../../utils");
const { OTP_TYPE, USER_STATUS, TOKEN_TYPE, SESSION_STATUS, CREATOR_DEFAULT } = require('./../../constants')
const moment = require('moment-timezone');
const _ = require("lodash");
const getPagingData = require('../../utils/pagination');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const creatorSchemaTaxonomyModel = require("../../database/mongo/models/creatorSchemaTaxonomy.model");
const TubularController = require("../../controllers/tubular.controller");
const { creator } = require("../../database/mongo/schemas");

const configService = require("./config.service");
class CreatorService { }

const getTubularCreatorId = (tubularUrl) => {
  const regex = /creator\/(\w+)/;
  const match = tubularUrl.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  return null;
};

async function updateCreatorData(data, findCreator) {
  try {
    const updateData = await creatorV2.updateOne(
      { Instagram_handle: data.Instagram_handle },
      {
        $set: {
          "June_2023_Performance.instagram.monthly_performance.followers": findCreator.profile.profile.followers,
          "June_2023_Performance.instagram.monthly_performance.engagements": findCreator.profile.profile.engagements,
          "June_2023_Performance.instagram.monthly_performance.tcr.er": findCreator.profile.profile.engagementRate || null,
          "June_2023_Performance.instagram.monthly_performance.average_views": findCreator.profile.avgReelsPlays,
          "location": findCreator.profile.city,
          "modashThumbnail": findCreator.profile.profile.picture,
        },
      }
    );

    if (updateData && updateData.modifiedCount > 0) {
      console.log("Updated the following creator", data.Instagram_handle);
      return true;
    } else {
      console.log("No changes needed for the following creator", data.Instagram_handle);
      return false;
    }
  } catch (err) {
    console.error('Error updating creator:', err);
    return false;
  }
}

async function updateCreatorDataBatch(batchData) {
  try {
    const bulkUpdateOps = batchData.map((data) => ({
      updateOne: {
        filter: { Instagram_handle: data.Instagram_handle },
        update: {
          $set: {
            "June_2023_Performance.instagram.monthly_performance.followers": data.findCreator.profile.profile.followers,
            "June_2023_Performance.instagram.monthly_performance.engagements": data.findCreator.profile.profile.engagements,
            "June_2023_Performance.instagram.monthly_performance.tcr.er": data.findCreator.profile.profile.engagementRate || null,
            "June_2023_Performance.instagram.monthly_performance.average_views": data.findCreator.profile.avgReelsPlays,
          },
        },
      },
    }));

    if (bulkUpdateOps.length > 0) {
      const result = await creatorV2.bulkWrite(bulkUpdateOps, { ordered: false });
      console.log("Updated creators:", result.modifiedCount);
    }
  } catch (err) {
    console.error('Error updating creators:', err);
  }
}

async function readJSONFile(jsonFilePath) {
  try {
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    return jsonData;
  } catch (err) {
    console.error('Error reading JSON file:', err);
    return null;
  }
}

function getInstagramHandles(data) {
  const instagramHandles = [];
  for (const creator of data) {
    const igLink = creator["IG Link"];
    if (igLink && igLink !== "NA") {
      // Check if the link is a URL
      if (igLink.includes("instagram.com")) {
        const matches = igLink.match(/instagram.com\/([A-Za-z0-9_.]+)/);
        if (matches && matches.length > 1) {
          instagramHandles.push(matches[1]);
        }
      } else {
        // Extract the handle from the parentheses
        const matches = igLink.match(/@([A-Za-z0-9_.]+)/);
        if (matches && matches.length > 1) {
          instagramHandles.push(matches[1]);
        }
      }
    }
  }
  console.log(instagramHandles);
  return instagramHandles;
}

function pushDataToExcel(dataObjects, sheetName, filePath) {
  const worksheet = XLSX.utils.json_to_sheet(dataObjects);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filePath);
}

function flattenObject(obj, prefix = '') {
  let flattened = {};

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(
          flattened,
          flattenObject(obj[key], prefix + key + '_')
        );
      } else {
        flattened[prefix + key] = obj[key];
      }
    }
  }

  return flattened;
}

function distributeExponentially(startValue, endValue, numPoints) {
  const exponentialPoints = [];
  const ratio = Math.pow(endValue / startValue, 1 / (numPoints - 1));

  for (let i = 0; i < numPoints; i++) {
    const value = Math.round(startValue * Math.pow(ratio, i));
    exponentialPoints.push(value);
  }

  return exponentialPoints;
}


CreatorService.createCreator = async (body) => {
  try {
    let creator = await creatorV2.create(body);
    console.log("🚀 ~ file: creator.service.js:12 ~ CreatorService.createCreator= ~ creator:", creator)
    if (!creator) return false;
    return {
      code: statusCodes.HTTP_OK,
      data: creator,
      message: messages.creatorCreated
    }
  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
}

CreatorService.getAllCreatorData = async (query) => {



  return {
    code: statusCodes.HTTP_OK,
    data: data,
    message: "Creator data fetched successfully"
  };

}

CreatorService.getAllCreatorData2 = async (query) => {
  try {
    let {
      filters,
      verified,
      minFollowers,
      maxFollowers,
      minViews,
      maxViews,
      minEngagements,
      maxEngagements,
      genre,
      sort,
      gender,
      age,
      location,
      platform,
      page,
      size,
      animetaVerified,
      search,
      instadeal,
      sortValue,
      engagements,
      views,
      views_growth_yoy,
      average_engagement,
      average_views,
      followers
    } = query;
    page = Number(page);
    limit = Number(size);
    let offset = (page - 1) * limit;
    let condition = {};
    let data;
    function capitalizeFirstLetter(word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    platform = capitalizeFirstLetter(platform);
    console.log("🚀 ~ file: creator.service.js:64 ~ CreatorService.getAllCreatorData= ~ platform:", platform)
    // let platformSort;
    // if(platform == "youtube") {
    //   platformSort = "YT_Current_All_Time_Subscribers";
    // } else if(platform == "instagram") {
    //   platformSort = "Instagram_Current_All_Time_Followers";
    // } else if(platform == "facebook") {
    //   platformSort = "Facebook_Current_All_Time_Page_Likes";
    // }
    console.log("🚀 ~ file: creator.service.js:12 ~ CreatorService.getAllCreatorData= ~ query", query);

    if (filters == 'true' || maxViews > 0 || maxFollowers > 0 || maxEngagements > 0) {
      filters = true;
      condition = {};
      verified = verified || false;
      minFollowers = minFollowers || 0;
      maxFollowers = maxFollowers || 0;
      minViews = minViews || 0;
      maxViews = maxViews || 5000000;
      minEngagements = minEngagements || 0;
      maxEngagements = maxEngagements || 70000000;
      genre = genre || null;
      sort = sort || null;

      if (gender) {
        gender = JSON.parse(gender) || null;
      }
      // let genreValue;
      // if(genre) {
      //   genreValue = genre.match(/"(.*?)"/g).map(str => str.replace(/"/g, ''));
      //   // finalGenre = genreValue.map(value => JSON.parse(value));
      //   console.log("🚀 ~ file: creator.service.js:58 ~ CreatorService.getAllCreatorData= ~ genre", genre[0]);
      // }

      age = age || null;
      location = location || null;

      // console.log("🚀 ~ file: creator.service.js:58 ~ CreatorService.getAllCreatorData= ~ gender:", gender);

      if (verified) {
        if (verified == 'true') {
          condition.animetaVerified = true;
        } else if (verified == 'false') {
          condition.animetaVerified = { $in: [true, false] }
        }
      }

      switch (platform) {
        case "Youtube":
          if (minFollowers && maxFollowers) {
            condition.June_2023_Performance.youtube.monthly_performance.followers_all_time = { $gte: minFollowers, $lte: maxFollowers };
          }
          if (minViews && maxViews) {
            condition.June_2023_Performance.youtube.monthly_performance.views = { $gte: minViews, $lte: maxViews };
          }
          if (minEngagements && maxEngagements) {
            condition.June_2023_Performance.youtube.monthly_performance.engagements = { $gte: minEngagements, $lte: maxEngagements };
          }

          if (gender) {
            condition.YT_male_all = { $lte: gender.male };
            condition.YT_female_all = { $lte: gender.female };
          }
          break;

        case "Facebook":
          if (minFollowers && maxFollowers) {
            condition.June_2023_Performance.facebook.monthly_performance.followers_all_time = { $gte: minFollowers, $lte: maxFollowers };
          }
          if (minViews && maxViews) {
            condition.June_2023_Performance.facebook.monthly_performance.views = { $gte: minViews, $lte: maxViews };
          }
          if (minEngagements && maxEngagements) {
            condition.June_2023_Performance.facebook.monthly_performance.engagements = { $gte: minEngagements, $lte: maxEngagements };
          }
          break;

        case "Instagram":
          if (minFollowers && maxFollowers) {
            condition.June_2023_Performance.instagram.monthly_performance.followers_all_time = { $gte: minFollowers, $lte: maxFollowers };
          }
          if (minEngagements && maxEngagements) {
            condition.June_2023_Performance.instagram.monthly_performance.engagements = { $gte: minEngagements, $lte: maxEngagements };
          }
          break;

        default:
          platform = "instagram";
          minFollowers = minFollowers || 3000;
          maxFollowers = maxFollowers || 300000000;
          if (minFollowers && maxFollowers) {
            condition.June_2023_Performance.instagram.monthly_performance.followers_all_time = { $gte: minFollowers, $lte: maxFollowers };
          }
          if (minEngagements && maxEngagements) {
            condition.June_2023_Performance.instagram.monthly_performance.followers_all_time = { $gte: minFollowers, $lte: maxFollowers };
          }
      }

      if (genre) {
        condition.Content_Genre = { $in: genre };
        console.log("🚀 ~ file: creator.service.js:269 ~ CreatorService.getAllCreatorData= ~ condition.Content_Genre:", condition.Content_Genre)
      }

      if (search) {
        condition.$or = [
          { creator_name: { $regex: search, $options: 'i' } },
          { Instagram_handle: { $regex: search, $options: 'i' } },
          { YT_Title: { $regex: search, $options: 'i' } }
        ]
      }

      if (instadeal) {
        if (instadeal == 'true') {
          condition.instadeal = true;
        } else if (instadeal == 'false') {
          condition.instadeal = { $in: [true, false, null] }
        }
      }

      let defaultSort;
      if (!sortValue) {
        switch (platform) {
          case 'youtube' || 'Youtube':
            defaultSort = { YT_Current_All_Time_Subscribers: -1 };
            break;
          case 'facebook' || 'Facebook':
            defaultSort = { Facebook_Current_All_Time_Page_Likes: -1 };
            break;
          case 'instagram' || 'Instagram':
            defaultSort = { Instagram_Current_All_Time_Followers: -1 };
            break;
          default:
            defaultSort = { Instagram_Current_All_Time_Followers: -1 };
        }
      }

      // console.log("🚀 ~ file: creator.service.js:138 ~ CreatorService.getAllCreatorData= ~ condition:", condition);
      let checkDocumentsExistence = await creatorV2.countDocuments(condition);
      let finalData = [];
      let totalItems;
      if (checkDocumentsExistence > 0) {
        console.log("PLATFOEMMMMMM ", platform)
        switch (platform) {

          case 'youtube' || 'Youtube':
            console.log("platform you", condition);
            console.log("🚀 ~ file: creator.service.js:185 ~ CreatorService.getAllCreatorData= ~ platform", platform)
            creator = await creatorV2.find(condition).sort(defaultSort).skip(offset).limit(limit).allowDiskUse(true);
            break;
          case 'facebook' || 'Facebook':
            console.log("🚀 ~ file: creator.service.js:185 ~ CreatorService.getAllCreatorData= ~ platform", platform)
            creator = await creatorV2.find(condition).sort(defaultSort).skip(offset).limit(limit).allowDiskUse(true);
            break;
          case 'Instagram' || 'instagram':
            console.log("platform", condition);
            console.log("🚀 ~ file: creator.service.js:185 ~ CreatorService.getAllCreatorData= ~ platform", platform)
            creator = await creatorV2.find(condition).sort(defaultSort).skip(offset).limit(limit).allowDiskUse(true);
            break;
          default:
            console.log("defplatform", condition);
            creator = await creatorV2.find(condition).skip(offset).limit(limit).allowDiskUse(true);
        }

        for (let item of creator) {
          let innerQuery = {};

          console.log(item.creator_id);
          let getCreatorProfilePicData = await creatorSchemaTaxonomyModel.findOne({ "creators.creator_id": item.creator_id }).lean();
          getCreatorProfilePicData = getCreatorProfilePicData ? getCreatorProfilePicData : {};
          console.log("🚀 ~ file: creator.service.js:349 ~ CreatorService.getAllCreatorData= ~ getCreatorProfilePicData:", getCreatorProfilePicData);
          let thumbnail = getCreatorProfilePicData.creators ? getCreatorProfilePicData.creators[0].thumbnail : '';

          if (platform == 'youtube') {
            innerQuery = { "accounts.youtube.gid": item.YT_gid };
          } else if (platform == 'facebook') {
            innerQuery = { "accounts.facebook.gid": item.Facebook_gid };
          } else if (platform == 'instagram') {
            innerQuery = { "accounts.instagram.gid": item.Instagram_gid };
          }
          let getCreatorData = await creators.findOne(innerQuery).lean();

          // console.log("This is the creator id: ", item);
          // console.log("🚀 ~ file: creator.service.js:190 ~ CreatorService.getAllCreatorData= ~ getCreatorData", getCreatorData);
          let facebookData = {};
          facebookData.monthly_performance = {
            total_followers: item.Facebook_Current_All_Time_Page_Likes ? item.Facebook_Current_All_Time_Page_Likes : 0,
            views: item.May_2023_Facebook_Views ? item.May_2023_Facebook_Views : 0,
            views_growth_yoy: item.May_2023_Facebook_Views_Growth ? item.May_2023_Facebook_Views_Growth : 0,
            engagements: item.May_2023_Facebook_Engagements ? item.May_2023_Facebook_Engagements : 0,
            engagements_growth_yoy: item.May_2023_Facebook_Engagements_Growth ? item.May_2023_Facebook_Engagements_Growth : 0,
            average_engagement: item.May_2023_Facebook_E30 ? item.May_2023_Facebook_E30 : 0,
            average_views: item.May_2023_Facebook_V30 ? item.May_2023_Facebook_V30 : 0,
          };
          let itemBody = {
            _id: item._id || "",
            brands: item.brands || [],
            creatorName: item.creator_name || "",
            profileURL: item.Tubular_Profile_URL || "",
            location: item.location || "",
            thumbnail: thumbnail || "",
            // averageMonthlyPerformance: getCreatorData.monthly_performance || {},
            animetaVerified: item.animetaVerified || false,
            Content_Genre: item.Content_Genre || "",
            instadeal: item.instadeal ? item.instadeal : "",
            platform: {
              facebook: facebookData ? facebookData : {},
              youtube: getCreatorData.accounts.youtube ? getCreatorData.accounts.youtube : {},
              instagram: getCreatorData.accounts.instagram ? getCreatorData.accounts.instagram : {}
            }
          };
          // if(itemBody.platform.facebook.monthly_performance) {

          // }
          if (itemBody.platform.youtube.monthly_performance) {
            itemBody.platform.youtube.monthly_performance = {
              average_engagement: item.May_2023_YouTube_E30 ? item.May_2023_YouTube_E30 : 0,
              average_views: item.May_2023_YouTube_V30 ? item.May_2023_YouTube_V30 : 0,
              views: item.May_2023_YT_Views ? item.May_2023_YT_Views : 0,
              engagements: item.May_2023_YT_Engagements ? item.May_2023_YT_Engagements : 0,
              views_growth_yoy: item.May_2023_YT_Views_Growth ? item.May_2023_YT_Views_Growth : 0,
              engagements_growth_yoy: item.May_2023_YT_Engagements_Growth ? item.May_2023_YT_Engagements_Growth : 0,
              total_followers: item.YT_Current_All_Time_Subscribers ? item.YT_Current_All_Time_Subscribers : 0,
              views_growth_yoy: item.May_2023_YT_Views_Growth ? item.May_2023_YT_Views_Growth : 0,
            }
          }
          if (itemBody.platform.instagram.monthly_performance) {
            itemBody.platform.instagram.monthly_performance = {
              average_engagement: item.May_2023_Instagram_E30 ? item.May_2023_Instagram_E30 : 0,
              average_views: item.May_2023_Instagram_V30 ? item.May_2023_Instagram_V30 : 0,
              total_followers: item.Instagram_Current_All_Time_Followers ? item.Instagram_Current_All_Time_Followers : 0,
              views_growth_yoy: item.Instagram_30_days_Followers_Growth ? item.Instagram_30_days_Followers_Growth : 0,
              engagements: item.May_2023_Instagram_Engagements ? item.May_2023_Instagram_Engagements : 0,
            }
          }
          finalData.push(itemBody);
        }

        if (!creator) return false;
        if (sortValue) {
          if (platform == "YouTube") {
            if (followers) {
              followers = "true" ? defaultSort = { YT_Current_All_Time_Subscribers: 1 } : defaultSort = { YT_Current_All_Time_Subscribers: -1 }
            } else if (views) {
              views == "true" ? defaultSort = { May_2023_YT_Views: -1 } : defaultSort = { May_2023_YT_Views: 1 }
            } else if (average_views) {
              average_views = "true" ? defaultSort = { May_2023_YouTube_V30: -1 } : defaultSort = { May_2023_YouTube_V30: 1 }
            } else if (engagements) {
              engagements == "true" ? defaultSort = { May_2023_YT_Engagements: -1 } : defaultSort = { May_2023_YT_Engagements: 1 }
            } else if (average_engagement) {
              average_engagement == "true" ? defaultSort = { May_2023_YouTube_E30: -1 } : defaultSort = { May_2023_YouTube_E30: 1 }
            }
          } else if (platform == "Facebook") {
            if (followers) {
              followers == "true" ? defaultSort = { Facebook_Current_All_Time_Page_Likes: 1 } : defaultSort = { Facebook_Current_All_Time_Page_Likes: -1 }
            } else if (views) {
              views == "true" ? defaultSort = { May_2023_Facebook_Views: -1 } : defaultSort = { May_2023_Facebook_Views: 1 }
            } else if (average_views) {
              average_views == "true" ? defaultSort = { May_2023_Facebook_V30: -1 } : defaultSort = { May_2023_Facebook_V30: 1 }
            } else if (engagements) {
              engagements == "true" ? defaultSort = { May_2023_Facebook_Engagements: -1 } : defaultSort = { May_2023_Facebook_Engagements: 1 }
            } else if (average_engagement) {
              average_engagement == "true" ? defaultSort = { May_2023_Facebook_E30: -1 } : defaultSort = { May_2023_Facebook_E30: 1 }
            }
          } else if (platform == "Instagram") {
            if (followers) {
              followers == "true" ? defaultSort = { Instagram_Current_All_Time_Followers: 1 } : defaultSort = { Instagram_Current_All_Time_Followers: -1 }
            } else if (average_views) {
              average_views == "true" ? defaultSort = { May_2023_Instagram_V30: -1 } : defaultSort = { May_2023_Instagram_V30: 1 }
            } else if (engagements) {
              engagements == "true" ? defaultSort = { May_2023_Instagram_Engagements: -1 } : defaultSort = { May_2023_Instagram_Engagements: 1 }
            } else if (average_engagement) {
              average_engagement == "true" ? defaultSort = { May_2023_Instagram_E30: -1 } : defaultSort = { May_2023_Instagram_E30: 1 }
            }
          }
        }
        totalItems = await creatorV2.countDocuments(condition);
      }
      data = getPagingData(finalData, 1, totalItems, totalItems);
    } else {
      // let finalGenre, genreValue;
      // if(genre) {
      //   genreValue = genre.match(/"(.*?)"/g).map(str => str.replace(/"/g, ''));
      //   // finalGenre = genreValue.map(value => JSON.parse(value));
      //   console.log("🚀 ~ file: creator.service.js:58 ~ CreatorService.getAllCreatorData= ~ genre", finalGenre);
      // }
      console.log("else")

      if (platform) {
        if (platform === 'youtube') {
          condition = { ...condition, YT_Title: { $exists: true } };
        } else if (platform === 'facebook') {
          condition = { ...condition, Facebook_Username: { $exists: true } };
        } else if (platform === 'instagram') {
          condition = { ...condition, Instagram_handle: { $exists: true } };
        } else if (platform === 'tiktok') {
          condition = { ...condition, TikTok_Username: { $exists: true } };
        }
      }

      if (search) {
        condition.$or = [
          { creator_name: { $regex: search, $options: 'i' } },
          { Instagram_handle: { $regex: search, $options: 'i' } },
          { YT_Title: { $regex: search, $options: 'i' } }
        ]
      }

      if (verified) {
        if (verified == 'true') {
          condition.animetaVerified = true;
        } else if (verified == 'false') {
          condition.animetaVerified = { $in: [true, false, null] }
        }
      }

      // console.log("🚀 ~ file: creator.service.js:183 ~ CreatorService.getAllCreatorData= ~ condition", condition);
      if (genre) {
        condition.Content_Genre = { $in: genre };
        console.log("🚀 ~ file: creator.service.js:269 ~ CreatorService.getAllCreatorData= ~ condition.Content_Genre:", condition.Content_Genre)
      }

      if (instadeal) {
        if (instadeal == true) {
          condition.instadeal = true;
        } else if (instadeal == false) {
          condition.instadeal = { $in: [true, false, null] }
        }
      }
      let creator;
      let defaultSort;
      if (!sortValue) {
        switch (platform) {
          case 'youtube' || 'Youtube':
            defaultSort = { YT_Current_All_Time_Subscribers: -1 };
            break;
          case 'facebook' || 'Facebook':
            defaultSort = { Facebook_Current_All_Time_Page_Likes: -1 };
            break;
          case 'instagram' || 'Instagram':
            defaultSort = { Instagram_Current_All_Time_Followers: -1 };
            break;
          default:
            defaultSort = { Instagram_Current_All_Time_Followers: -1 };
        }
      }
      if (sortValue) {
        if (platform == "YouTube") {
          if (followers) {
            followers == "true" ? defaultSort = { YT_Current_All_Time_Subscribers: 1 } : defaultSort = { YT_Current_All_Time_Subscribers: -1 }
          } else if (views) {
            views == "true" ? defaultSort = { May_2023_YT_Views: -1 } : defaultSort = { May_2023_YT_Views: 1 }
          } else if (average_views) {
            average_views == "true" ? defaultSort = { May_2023_YouTube_V30: -1 } : defaultSort = { May_2023_YouTube_V30: 1 }
          } else if (engagements) {
            engagements == "true" ? defaultSort = { May_2023_YT_Engagements: -1 } : defaultSort = { May_2023_YT_Engagements: 1 }
          } else if (average_engagement) {
            average_engagement == "true" ? defaultSort = { May_2023_YouTube_E30: -1 } : defaultSort = { May_2023_YouTube_E30: 1 }
          }
        } else if (platform == "Facebook") {
          if (followers) {
            followers == "true" ? defaultSort = { Facebook_Current_All_Time_Page_Likes: 1 } : defaultSort = { Facebook_Current_All_Time_Page_Likes: -1 }
          } else if (views) {
            views == "true" ? defaultSort = { May_2023_Facebook_Views: -1 } : defaultSort = { May_2023_Facebook_Views: 1 }
          } else if (average_views) {
            average_views == "true" ? defaultSort = { May_2023_Facebook_V30: -1 } : defaultSort = { May_2023_Facebook_V30: 1 }
          } else if (engagements) {
            engagements == "true" ? defaultSort = { May_2023_Facebook_Engagements: -1 } : defaultSort = { May_2023_Facebook_Engagements: 1 }
          } else if (average_engagement) {
            average_engagement == "true" ? defaultSort = { May_2023_Facebook_E30: -1 } : defaultSort = { May_2023_Facebook_E30: 1 }
          }
        } else if (platform == "Instagram") {
          if (followers) {
            followers == "true" ? defaultSort = { Instagram_Current_All_Time_Followers: 1 } : defaultSort = { Instagram_Current_All_Time_Followers: -1 }
          }

          if (average_views) {
            average_views == "true" ? defaultSort = { May_2023_Instagram_V30: -1 } : defaultSort = { May_2023_Instagram_V30: 1 }
          }
          if (engagements) {
            engagements == "true" ? defaultSort = { May_2023_Instagram_Engagements: -1 } : defaultSort = { May_2023_Instagram_Engagements: 1 }
          }
          if (average_engagement) {
            average_engagement == "true" ? defaultSort = { May_2023_Instagram_E30: -1 } : defaultSort = { May_2023_Instagram_E30: 1 }
          }
        }
      }
      console.log("🚀 ~ file: creator.service.js:320 ~ CreatorService.getAllCreatorData= ~ platform", platform);
      switch (platform) {
        case 'Youtube':
          console.log("🚀 ~ file: creator.service.js:320 ~ CreatorService.getAllCreatorData= ~ platform", platform)
          creator = await creatorV2.find(condition).sort(defaultSort).skip(offset).limit(limit).allowDiskUse(true);
          break;
        case 'Facebook':
          console.log("🚀 ~ file: creator.service.js:320 ~ CreatorService.getAllCreatorData= ~ platform", platform)
          creator = await creatorV2.find(condition).sort(defaultSort).skip(offset).limit(limit).allowDiskUse(true);
          break;
        case 'Instagram':
          console.log("🚀 ~ file: creator.service.js:320 ~ CreatorService.getAllCreatorData= ~ platform", platform)
          creator = await creatorV2.find(condition).sort(defaultSort).skip(offset).limit(limit).allowDiskUse(true);
          break;
        default:
          creator = await creatorV2.find(condition).skip(offset).limit(limit).allowDiskUse(true);
      }


      // console.log("🚀 ~ file: creator.service.js:186 ~ CreatorService.getAllCreatorData= ~ creator:", creator);

      let finalData = [];

      for (let item of creator) {
        let innerQuery = {};
        console.log(item.creator_id);
        let getCreatorProfilePicData = await creatorSchemaTaxonomyModel.findOne({ "creators.creator_id": item.creator_id }).lean();
        getCreatorProfilePicData = getCreatorProfilePicData ? getCreatorProfilePicData : {};
        console.log("🚀 ~ file: creator.service.js:349 ~ CreatorService.getAllCreatorData= ~ getCreatorProfilePicData:", getCreatorProfilePicData);
        // let thumbnail = getCreatorProfilePicData.creators ? getCreatorProfilePicData.creators[0].thumbnail : '';
        let thumbnail = item.thumbnail ? item.thumbnail : '';
        console.log("This is the thumbnail", thumbnail);
        if (platform === 'youtube') {
          innerQuery = { "accounts.youtube.gid": item.YT_gid };
        } else if (platform === 'facebook') {
          innerQuery = { "accounts.facebook.gid": item.Facebook_gid };
        } else if (platform === 'instagram') {
          innerQuery = { "accounts.instagram.gid": item.Instagram_gid };
        }

        // console.log("🚀 ~ file: creator.service.js:204 ~ CreatorService.getAllCreatorData= ~ innerQuery", innerQuery, platform);

        let getCreatorData = await creators.findOne(innerQuery).lean();

        // console.log("🚀 ~ file: creator.service.js:245 ~ CreatorService.getAllCreatorData= ~ getCreatorData:", getCreatorData);
        let facebookData = {};
        facebookData.monthly_performance = {
          total_followers: item.Facebook_Current_All_Time_Page_Likes ? item.Facebook_Current_All_Time_Page_Likes : 0,
          views: item.May_2023_Facebook_Views ? item.May_2023_Facebook_Views : 0,
          views_growth_yoy: item.May_2023_Facebook_Views_Growth ? item.May_2023_Facebook_Views_Growth : 0,
          engagements: item.May_2023_Facebook_Engagements ? item.May_2023_Facebook_Engagements : 0,
          engagements_growth_yoy: item.May_2023_Facebook_Engagements_Growth ? item.May_2023_Facebook_Engagements_Growth : 0,
          average_engagement: item.May_2023_Facebook_E30 ? item.May_2023_Facebook_E30 : 0,
          average_views: item.May_2023_Facebook_V30 ? item.May_2023_Facebook_V30 : 0,
        };
        let itemBody = {
          _id: item._id || "",
          brands: item.brands || [],
          creatorName: item.creator_name || "",
          profileURL: item.Tubular_Profile_URL || "",
          location: item.location || "",
          thumbnail: thumbnail || "",
          // averageMonthlyPerformance: getCreatorData.monthly_performance || {},
          animetaVerified: item.animetaVerified || false,
          Content_Genre: item.Content_Genre || "",
          instadeal: item.instadeal ? item.instadeal : "",
          platform: {
            facebook: facebookData ? facebookData : {},
            youtube: getCreatorData.accounts.youtube ? getCreatorData.accounts.youtube : {},
            instagram: getCreatorData.accounts.instagram ? getCreatorData.accounts.instagram : {}
          }
        };
        // if(itemBody.platform.facebook.monthly_performance) {

        // }
        if (itemBody.platform.youtube.monthly_performance) {
          itemBody.platform.youtube.monthly_performance = {
            average_engagement: item.May_2023_YouTube_E30 ? item.May_2023_YouTube_E30 : 0,
            average_views: item.May_2023_YouTube_V30 ? item.May_2023_YouTube_V30 : 0,
            views: item.May_2023_YT_Views ? item.May_2023_YT_Views : 0,
            engagements: item.May_2023_YT_Engagements ? item.May_2023_YT_Engagements : 0,
            views_growth_yoy: item.May_2023_YT_Views_Growth ? item.May_2023_YT_Views_Growth : 0,
            engagements_growth_yoy: item.May_2023_YT_Engagements_Growth ? item.May_2023_YT_Engagements_Growth : 0,
            total_followers: item.YT_Current_All_Time_Subscribers ? item.YT_Current_All_Time_Subscribers : 0,
            views_growth_yoy: item.May_2023_YT_Views_Growth ? item.May_2023_YT_Views_Growth : 0,
          }
        }
        if (itemBody.platform.instagram.monthly_performance) {
          itemBody.platform.instagram.monthly_performance = {
            average_engagement: item.May_2023_Instagram_E30 ? item.May_2023_Instagram_E30 : 0,
            average_views: item.May_2023_Instagram_V30 ? item.May_2023_Instagram_V30 : 0,
            total_followers: item.Instagram_Current_All_Time_Followers ? item.Instagram_Current_All_Time_Followers : 0,
            views_growth_yoy: item.Instagram_30_days_Followers_Growth ? item.Instagram_30_days_Followers_Growth : 0,
            engagements: item.May_2023_Instagram_Engagements ? item.May_2023_Instagram_Engagements : 0,
          }
        }
        finalData.push(itemBody);
      }
      let totalItems = await creatorV2.countDocuments(condition);
      data = getPagingData(finalData, page, limit, totalItems);
    }

    return {
      code: statusCodes.HTTP_OK,
      data: data,
      message: "Creator data fetched successfully"
    };
  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
}

CreatorService.getAllFilters = async (query) => {
  try {
    let { verified, minFollowers, maxFollowers, minViews, maxViews, minEngagements, maxEngagements, genre, sort, gender, age, location, platform, page, size } = query;
    page = Number(page);
    limit = Number(size);
    let offset = (page - 1) * limit;
    verified = verified || false;
    minFollowers = minFollowers || 3000;
    maxFollowers = maxFollowers || 300000000;
    minViews = minViews || 0;
    maxViews = maxViews || 5000000;
    minEngagements = minEngagements || 0;
    maxEngagements = maxEngagements || 70000000;
    genre = genre || [];
    sort = sort || null;
    gender = JSON.parse(gender) || null;
    age = age || null;
    location = location || null;
    console.log("🚀 ~ file: creator.service.js:119 ~ CreatorService.getAllFilters= ~ gender:", gender);
    let condition = {
      creatorV2Data: {}
    };
    if (verified) {
      condition = {
        ...condition,
        animetaVerified: true
      }
    }
    switch (platform) {
      case "Youtube":
        if (minFollowers && maxFollowers) {
          condition.creatorV2Data.YT_Current_All_Time_Subscribers = { $gte: minFollowers, $lte: maxFollowers };
        }
        if (minViews && maxViews) {
          condition.creatorV2Data.May_2023_YT_Views = { $gte: minViews, $lte: maxViews };
        }
        if (minEngagements && maxEngagements) {
          condition.creatorV2Data.May_2023_YT_Engagements = { $gte: minEngagements, $lte: maxEngagements };
        }
        if (gender) {
          condition.creatorV2Data.YT_male_all = { $lte: gender.male };
          condition.creatorV2Data.YT_female_all = { $lte: gender.female };
        }
        if (genre) {
          condition.creatorV2Data.Content_Genre = { $in: genre };
        }
        break;
      case "Facebook":
        if (minFollowers && maxFollowers) {
          condition.accounts.facebook.performance.followers = { $gte: minFollowers, $lte: maxFollowers };
        }
        if (minViews && maxViews) {
          condition.creatorV2Data.May_2023_Facebook_Views = { $gte: minViews, $lte: maxViews };
        }
        if (minEngagements && maxEngagements) {
          condition.creatorV2Data.May_2023_Facebook_Engagements = { $gte: minEngagements, $lte: maxEngagements };
        }
        if (genre) {
          condition.creatorV2Data.Content_Genre = { $in: genre };
        }
        break;
      case "Instagram":
        if (minFollowers && maxFollowers) {
          condition.creatorV2Data.Instagram_Current_All_Time_Followers = { $gte: minFollowers, $lte: maxFollowers };
        }
        //Views will not work for instagram since there is no monthly viewer data
        // if (minViews && maxViews) {
        //   condition.accounts.instagram.performance.views = { $gte: minViews, $lte: maxViews };
        // }
        if (minEngagements && maxEngagements) {
          condition.creatorV2Data.May_2023_Instagram_Engagements = { $gte: minEngagements, $lte: maxEngagements };
        }
        if (genre) {
          condition.creatorV2Data.Content_Genre = { $in: genre };
        }
        break;
      default:
        platform = "Instagram";
        if (minFollowers && maxFollowers) {
          condition.creatorV2Data.Instagram_Current_All_Time_Followers = { $gte: minFollowers, $lte: maxFollowers };
        }
        //Views will not work for instagram since there is no monthly viewer data
        // if (minViews && maxViews) {
        //   condition.accounts.instagram.performance.views = { $gte: minViews, $lte: maxViews };
        // }
        if (minEngagements && maxEngagements) {
          condition.creatorV2Data.May_2023_Instagram_Engagements = { $gte: minEngagements, $lte: maxEngagements };
        }
        if (genre) {
          condition.creatorV2Data.Content_Genre = { $in: genre };
        }
    }
    condition = condition.creatorV2Data;
    console.log("🚀 ~ file: creator.service.js:216 ~ CreatorService.getAllFilters= ~ condition:", condition)
    let creator = await creatorV2.find(condition).skip(offset).limit(limit);
    let finalData = [];
    creator.forEach(async (item) => {
      let getCreatorData = await creators.findOne({ creator_id: item.creator_id });
      let itemBody = {
        _id: item._id ? item._id : "",
        brands: item.brands ? item.brands : [],
        creatorName: item.creator_name ? item.creator_name : "",
        profileURL: item.Tubular_Profile_URL ? item.Tubular_Profile_URL : "",
        location: item.location ? item.location : "",
        thumbnail: getCreatorData.thumbnail ? getCreatorData.thumbnail : "",
        type: getCreatorData.type ? getCreatorData.type : "",
        averageMonthlyPerformance: getCreatorData.monthly_performance ? getCreatorData.monthly_performance : {},
        platform: {
          facebook: getCreatorData.accounts.facebook ? getCreatorData.accounts.facebook : {},
          youtube: getCreatorData.accounts.youtube ? getCreatorData.accounts.youtube : {},
          instagram: getCreatorData.accounts.instagram ? getCreatorData.accounts.instagram : {}
        }
      }
      finalData.push(itemBody);
    });
    if (!creator) return false;
    let totalItems = await creatorV2.countDocuments(condition);
    let data = getPagingData(finalData, 1, totalItems, totalItems);
    return {
      code: statusCodes.HTTP_OK,
      data: data,
      message: messages.creatorCreated
    }
    // let getDistinctGenres = await creatorV2.distinct('Content_Genre');
    // console.log("🚀 ~ file: creator.service.js:90 ~ CreatorService.getFilters= ~ getDistinctGenres:", getDistinctGenres)

  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
}

CreatorService.getCreatorById = async (id) => {
  try {
    let creatorName = await creatorV2.findOne({ _id: id });
    creatorName = creatorName.creator_name;
    console.log("🚀 ~ file: creator.service.js:111 ~ CreatorService.getCreatorById= ~ creatorName:", creatorName)
    const pipeline = [
      {
        $match: { creator_name: creatorName }
      },
      {
        $lookup: {
          from: 'creatorv2',
          localField: 'creator_name',
          foreignField: 'creator_name',
          as: 'creatorV2Data'
        }
      }
    ];
    let creatorValue = await creators.aggregate(pipeline);
    console.log("🚀 ~ file: creator.service.js:764 ~ CreatorService.getCreatorById= ~ creatorValue", creatorValue);
    creatorValue[0].brands = creatorValue[0].creatorV2Data[0].brands ? creatorValue[0].creatorV2Data[0].brands : [];
    creatorValue[0].titleVideo = "https://scontent-bom1-1.cdninstagram.com/o1/v/t16/f1/m82/664D8C74FB16EAA74BC42BD2B3CFB081_video_dashinit.mp4?efg=eyJxZV9ncm91cHMiOiJbXCJpZ193ZWJfZGVsaXZlcnlfdnRzX290ZlwiXSIsInZlbmNvZGVfdGFnIjoidnRzX3ZvZF91cmxnZW4uNzIwLmNsaXBzLmJhc2VsaW5lIn0&_nc_ht=scontent-bom1-1.cdninstagram.com&_nc_cat=103&vs=590588946459992_3243512422&_nc_vs=HBksFQIYT2lnX3hwdl9yZWVsc19wZXJtYW5lbnRfcHJvZC82NjREOEM3NEZCMTZFQUE3NEJDNDJCRDJCM0NGQjA4MV92aWRlb19kYXNoaW5pdC5tcDQVAALIAQAVABgkR0VJTUdoVHR4YjRySG5jREFEeUVYbEFrSDVGcWJxX0VBQUFGFQICyAEAKAAYABsAFQAAJv7li5uU95ZBFQIoAkMzLBdAQCZFocrAgxgSZGFzaF9iYXNlbGluZV8xX3YxEQB1%2FgcA&_nc_rid=3a8de5cbda&ccb=9-4&oh=00_AfCAhszjIMFXqLk7Cr-YrWbpPRcBRY2dexhc2eDonfWGGg&oe=64B2BA6D&_nc_sid=2999b8";
    if (!creatorValue) return false;
    return {
      code: statusCodes.HTTP_OK,
      data: creatorValue,
      message: messages.creatorDataFetchedSuccessFully
    }
  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
}

CreatorService.createCreatorMapping = async (body) => {
  try {
    let creator = [
      {
        "Creator_X_Sponsors_Serial": 4,
        "creator_name": "Heroindori",
        "brands": "OkCredit"
      },
      {
        "Creator_X_Sponsors_Serial": 5,
        "creator_name": "ChessBase India",
        "brands": "Freedom Broker"
      }
    ];
    const mapping = {};
    creator.forEach((item) => {
      const { creator_name, brands } = item;
      if (mapping[creator_name]) {
        mapping[creator_name].push(brands);
      } else {
        mapping[creator_name] = [brands];
      }
    });
    let updaterCount = 0;
    let updateCreatorMapping = await CreatorService.updateCreatorMapping(mapping);
    return {
      code: statusCodes.HTTP_OK,
      data: updateCreatorMapping,
      message: "Updated Successfully"
    }
  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
};

CreatorService.updateCreatorMapping = async (data) => {
  try {
    for (const [creatorName, brands] of Object.entries(data)) {
      const filter = { creator_name: creatorName };
      const update = { $push: { brands: { $each: brands } } };

      const updatedCreator = await creatorV2.findOneAndUpdate(filter, update, { new: true });

      if (updatedCreator) {
        console.log('Creator updated:', updatedCreator);
      } else {
        console.log('Creator not found:', creatorName);
      }
    }
  } catch (err) {
    console.error('Error updating creators:', err);
    throw new Error(err);
  }
}

CreatorService.findMinAndMax = async (key) => {
  try {
    const aggregationPipeline = [
      {
        $group: {
          _id: null,
          minValue: { $min: `$${key}` },
          maxValue: { $max: `$${key}` }
        }
      },
      {
        $project: {
          _id: 0,
          minValue: 1,
          maxValue: 1
        }
      }
    ];

    return await creatorV2.aggregate(aggregationPipeline);
  } catch (err) {
    throw new Error(err);
  }

}

CreatorService.findDistinct = async (key) => {
  try {
    const query = {
      [key]: { $ne: null }
    };

    return await creatorV2.distinct(key, query);
  } catch (err) {
    throw new Error(err);
  }

}


CreatorService.findDistinctForRisignStar = async (key) => {
  try {
    const query = {
      "rising_star": true,
      [key]: { $ne: null },
      
    };

    return await creatorV2.distinct(key, query);
  } catch (err) {
    throw new Error(err);
  }

}


// RIP
CreatorService.getFilterData = async (query, body) => {
  try {
    const highestFilterPromises = [
      creatorV2.find({}).sort({ "Instagram_Current_All_Time_Followers": -1 }).limit(1),
      creatorV2.find({}).sort({ "YT_Current_All_Time_Subscribers": -1 }).limit(1),
      creatorV2.find({}).sort({ "YT_Current_All_Time_Subscribers": -1 }).limit(1),
      creatorV2.find({}).sort({ "May_2023_YT_Views": -1 }).limit(1),
      creatorV2.find({}).sort({ "May_2023_Facebook_Views": -1 }).limit(1),
      creatorV2.find({}).sort({ "May_2023_YT_Engagements": -1 }).limit(1),
      creatorV2.find({}).sort({ "May_2023_Facebook_Engagements": -1 }).limit(1),
      creatorV2.find({}).sort({ "May_2023_Instagram_Engagements": -1 }).limit(1),
      creatorV2.distinct('Content_Genre'),
      creatorV2.find({}).sort({ [CREATOR_DEFAULT.youtubeKEY.average_views]: -1 }).limit(1),
      creatorV2.find({}).sort({ [CREATOR_DEFAULT.youtubeKEY.average_engagement]: -1 }).limit(1),
      creatorV2.find({}).sort({ [CREATOR_DEFAULT.facebookKEY.average_views]: -1 }).limit(1),
      creatorV2.find({}).sort({ [CREATOR_DEFAULT.facebookKEY.average_engagement]: -1 }).limit(1),
      creatorV2.find({ [CREATOR_DEFAULT.instagramKEY.average_views]: { $exists: true, $ne: "" } }).sort({ [CREATOR_DEFAULT.instagramKEY.average_views]: -1 }).limit(1),
      creatorV2.find({}).sort({ [CREATOR_DEFAULT.instagramKEY.average_engagement]: -1 }).limit(1),
      creatorV2.distinct("location", { location: { $ne: null } })

    ];

    const lowestFilterPromises = [
      creatorV2.find({ Instagram_Current_All_Time_Followers: { $exists: true, $ne: "" } }).sort({ "Instagram_Current_All_Time_Followers": 1 }).limit(1),
      creatorV2.find({ YT_Current_All_Time_Subscribers: { $exists: true, $ne: "" } }).sort({ "YT_Current_All_Time_Subscribers": 1 }).limit(1),
      creatorV2.find({ YT_Current_All_Time_Subscribers: { $exists: true, $ne: "" } }).sort({ "YT_Current_All_Time_Subscribers": 1 }).limit(1),
      creatorV2.find({ May_2023_YT_Views: { $exists: true, $ne: "" } }).sort({ "May_2023_YT_Views": 1 }).limit(1),
      creatorV2.find({ May_2023_Facebook_Views: { $exists: true, $ne: "" } }).sort({ "May_2023_Facebook_Views": 1 }).limit(1),
      creatorV2.find({ May_2023_YT_Engagements: { $exists: true, $ne: "" } }).sort({ "May_2023_YT_Engagements": 1 }).limit(1),
      creatorV2.find({ May_2023_Facebook_Engagements: { $exists: true, $ne: "" } }).sort({ "May_2023_Facebook_Engagements": 1 }).limit(1),
      creatorV2.find({ May_2023_Instagram_Engagements: { $exists: true, $ne: "" } }).sort({ "May_2023_Instagram_Engagements": 1 }).limit(1),
      creatorV2.find({ [CREATOR_DEFAULT.youtubeKEY.average_views]: { $exists: true, $ne: "" } }).sort({ [CREATOR_DEFAULT.youtubeKEY.average_views]: 1 }).limit(1),
      creatorV2.find({ [CREATOR_DEFAULT.youtubeKEY.average_engagement]: { $exists: true, $ne: "" } }).sort({ [CREATOR_DEFAULT.youtubeKEY.average_engagement]: 1 }).limit(1),
      creatorV2.find({ [CREATOR_DEFAULT.facebookKEY.average_views]: { $exists: true, $ne: "" } }).sort({ [CREATOR_DEFAULT.facebookKEY.average_views]: 1 }).limit(1),
      creatorV2.find({ [CREATOR_DEFAULT.facebookKEY.average_engagement]: { $exists: true, $ne: "" } }).sort({ [CREATOR_DEFAULT.facebookKEY.average_engagement]: 1 }).limit(1),
      creatorV2.find({ [CREATOR_DEFAULT.instagramKEY.average_views]: { $exists: true, $ne: "" } }).sort({ [CREATOR_DEFAULT.instagramKEY.average_views]: 1 }).limit(1),
      creatorV2.find({ [CREATOR_DEFAULT.instagramKEY.average_engagement]: { $exists: true, $ne: "" } }).sort({ [CREATOR_DEFAULT.instagramKEY.average_engagement]: 1 }).limit(1),
    ];

    const [
      min_instagramFilterValue,
      min_youtubeFilterValue,
      min_facebookFilterValue,
      min_youTubeViewsFilter,
      min_facebookViewsFilter,
      min_youTubeEngagementFilter,
      min_facebookEngagementFilter,
      min_instagramEngagementFilter,
      min_youtubeAverageViewsFilter,
      min_youTubeAverageEngagementFilter,
      min_facebookAverageViewsFilter,
      min_facebookAverageEngagementFilter,
      min_instagramAverageViewsFilter,
      min_instagramAverageEngagementFilter,

    ] = await Promise.all(lowestFilterPromises);

    const [
      instagramHighestFilterValue,
      youtubeHighestFilterValue,
      facebookHighestFilterValue,
      youTubeViewsFilter,
      facebookViewsFilter,
      youTubeEngagementFilter,
      facebookEngagementFilter,
      instagramEngagementFilter,
      contentGenreFilter,
      max_youtubeAverageViewsFilter,
      max_youTubeAverageEngagementFilter,
      max_facebookAverageViewsFilter,
      max_facebookAverageEngagementFilter,
      max_instagramAverageViewsFilter,
      max_instagramAverageEngagementFilter,
      location
    ] = await Promise.all(highestFilterPromises);

    let filterData = {};
    filterData.distinctGenre = contentGenreFilter;
    filterData.highestFilters = {
      instagram: {
        followers: instagramHighestFilterValue.length ? roundToNearest(instagramHighestFilterValue[0].Instagram_Current_All_Time_Followers) : 0,
        engagement: instagramEngagementFilter.length ? roundToNearest(instagramEngagementFilter[0].May_2023_Instagram_Engagements) : 0,
        // average_views: max_instagramAverageViewsFilter.length ? roundToNearest(max_instagramAverageViewsFilter[0][CREATOR_DEFAULT.instagramKEY.average_views] ) : 0,
        // average_engagement: max_instagramAverageEngagementFilter.length ? roundToNearest(max_instagramAverageEngagementFilter[0][CREATOR_DEFAULT.instagramKEY.average_engagement] ): 0,
      },
      youtube: {
        followers: youtubeHighestFilterValue.length ? roundToNearest(youtubeHighestFilterValue[0].YT_Current_All_Time_Subscribers) : 0,
        views: youTubeViewsFilter.length ? roundToNearest(youTubeViewsFilter[0].May_2023_YT_Views) : 0,
        engagement: youTubeEngagementFilter.length ? roundToNearest(youTubeEngagementFilter[0].May_2023_YT_Engagements) : 0,
        // average_views:max_youtubeAverageViewsFilter.length ?  roundToNearest(max_youtubeAverageViewsFilter[0][CREATOR_DEFAULT.youtubeKEY.average_views] ):0,
        // average_engagement:max_youTubeAverageEngagementFilter.length ? roundToNearest(max_youTubeAverageEngagementFilter[0][CREATOR_DEFAULT.youtubeKEY.average_engagement] ):0,
      },
      facebook: {
        followers: facebookHighestFilterValue.length ? roundToNearest(facebookHighestFilterValue[0].YT_Current_All_Time_Subscribers) : 0,
        views: facebookViewsFilter.length ? roundToNearest(facebookViewsFilter[0].May_2023_Facebook_Views) : 0,
        engagement: facebookEngagementFilter.length ? roundToNearest(facebookEngagementFilter[0].May_2023_Facebook_Engagements) : 0,
        // average_views: max_facebookAverageViewsFilter.length ? roundToNearest(max_facebookAverageViewsFilter[0][CREATOR_DEFAULT.facebookKEY.average_views] ):0,
        // average_engagement: max_facebookAverageEngagementFilter.length ? roundToNearest(max_facebookAverageEngagementFilter[0][CREATOR_DEFAULT.facebookKEY.average_engagement] ):0,
      }
    };




    filterData.minFilters = {
      instagram: {
        followers: min_instagramFilterValue.length ? min_instagramFilterValue[0].Instagram_Current_All_Time_Followers : 0,
        engagement: min_instagramEngagementFilter.length ? min_instagramEngagementFilter[0].May_2023_Instagram_Engagements : 0,
        // average_views: min_instagramAverageViewsFilter.length ? min_instagramAverageViewsFilter[0][CREATOR_DEFAULT.instagramKEY.average_views]  : 0,
        // average_engagement: min_instagramAverageEngagementFilter.length ? min_instagramAverageEngagementFilter[0][CREATOR_DEFAULT.instagramKEY.average_engagement] :0,

      },
      youtube: {
        followers: min_youtubeFilterValue.length ? min_youtubeFilterValue[0].YT_Current_All_Time_Subscribers : 0,
        views: min_youTubeViewsFilter.length ? min_youTubeViewsFilter[0].May_2023_YT_Views : 0,
        engagement: min_youTubeEngagementFilter.length ? min_youTubeEngagementFilter[0].May_2023_YT_Engagements : 0,
        // average_views: min_youtubeAverageViewsFilter.length ? min_youtubeAverageViewsFilter[0][CREATOR_DEFAULT.youtubeKEY.average_views] :0,
        // average_engagement:min_youTubeAverageEngagementFilter.length ?min_youTubeAverageEngagementFilter[0][CREATOR_DEFAULT.youtubeKEY.average_engagement] :0,

      },
      facebook: {
        followers: min_facebookFilterValue.length ? min_facebookFilterValue[0].YT_Current_All_Time_Subscribers : 0,
        views: min_facebookViewsFilter.length ? min_facebookViewsFilter[0].May_2023_Facebook_Views : 0,
        engagement: min_facebookEngagementFilter.length ? min_facebookEngagementFilter[0].May_2023_Facebook_Engagements : 0,
        // average_views:min_facebookAverageViewsFilter.length ? min_facebookAverageViewsFilter[0][CREATOR_DEFAULT.facebookKEY.average_views] :0,
        // average_engagement:min_facebookAverageEngagementFilter.length ? min_facebookAverageEngagementFilter[0][CREATOR_DEFAULT.facebookKEY.average_engagement] :0,

      }
    };

    filterData.location = location;

    const creatorSize = await configService.getConfig("creatorSize");
    if (creatorSize && creatorSize.length && creatorSize[0].configList) {
      filterData.creatorSize = creatorSize[0].configList.filter(x => (x !== "Public Figure"))
    }


    // console.log("🚀 ~ filterData.distinctGenre:", filterData.distinctGenre);

    if (!filterData) return false;

    return {
      code: statusCodes.HTTP_OK,
      data: filterData,
      message: "Data Fetched Successfully"
    };
  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
};


CreatorService.getDataMatchFromCreatorV2 = async (body) => {
  try {
    let data = body;
    let responseBody = await getInstagramHandles(data);
    console.log("🚀 ~ file: creator.service.js:736 ~ CreatorService.getFilters= ~:", responseBody, responseBody.length);
    let finalReceivedData = [];
    responseBody.forEach(async (data) => {
      let findData = await creatorV2.findOne({ Instagram_handle: data });
      // console.log("🚀 ~ file: creator.service.js:736 ~ CreatorService.getFilters= ~ getDistinctGenres:", findData);
      let response = {};
      findData = findData ? findData : {};
      response.creator_name = findData.creator_name;
      response.Instagram_handle = findData.Instagram_handle;
      response.instagramFollowers = findData.Instagram_Current_All_Time_Followers ? findData.Instagram_Current_All_Time_Followers : 0;
      response.youtubeSubscribers = findData.YT_Current_All_Time_Subscribers ? findData.YT_Current_All_Time_Subscribers : 0;
      // console.log(response);
      finalReceivedData.push(response);
      // console.log("This is the data", finalReceivedData[0]);
    });
    setTimeout(async () => {

      console.log("This is the data out", finalReceivedData[0], finalReceivedData.length);
      // Flatten the JSON objects
      const flattenedData = finalReceivedData.map(obj => flattenObject(obj));

      // Create a new worksheet
      const worksheet = XLSX.utils.json_to_sheet(flattenedData);

      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Creator Data');

      // Generate an Excel file buffer
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      // Save the buffer to a file
      await fs.writeFileSync('data.xlsx', excelBuffer);
    }, 80000);
    return {
      code: statusCodes.HTTP_OK,
      data: finalReceivedData,
      message: "Data Fetched Successfully"
    }
  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
};



CreatorService.getCount = async (query) => {
  try {
    return await creatorV2.countDocuments(query);
  } catch (err) {
    throw new Error(err)
  }
}

CreatorService.getCountWithAggregate = async (query) => {
  try {

    return await creatorV2.aggregate(query).allowDiskUse(true);
  } catch (err) {
    throw new Error(err)
  }
}



CreatorService.getCreatorsWithFilters = async (filterValues, sort, limit, offset) => {
  try {
    return await creatorV2.find(filterValues).sort(sort).skip(offset).limit(limit).allowDiskUse(true);
  } catch (err) {
    throw new Error(err)
  }
}


CreatorService.getCreatorsWithAggregate = async (aggregation) => {
  try {
    return await creatorV2.aggregate(aggregation)
  } catch (err) {
    throw new Error(err)
  }
}

CreatorService.getCreatorProfilePicData = async (query) => {
  try {
    return await creatorSchemaTaxonomyModel.findOne(query).lean();
  } catch (err) {
    throw new Error(err)
  }
}


CreatorService.getCreators = async (query) => {
  try {
    return await creators.findOne(query).lean();
  } catch (err) {
    throw new Error(err)
  }
}


CreatorService.getCollapseImagesData = async (brandCollaboratorName) => {
  try {
    return await brandCollaboratorImages.findOne({ brandCollaboratorName });
  } catch (err) {
    throw new Error(err)
  }
}

CreatorService.getContentGenre = async () => {
  try {
    return await creatorV2.distinct('Content_Genre');
  } catch (err) {
    throw new Error(err)
  }
}

CreatorService.getRisingStarData = async (query) => {
  try {
    let { category, page, size, minFollowers, maxFollowers } = query;
    page = page ? Number(page) : 1;
    size = size ? Number(size) : 9;
    const limit = size;
    const offset = (page - 1) * limit;
    let queryObj = {};
    queryObj.rising_star = true;
    if (category) {
      // category = JSON.parse(category);
      queryObj.Content_Genre = { $in: category };
    }
    if (minFollowers && maxFollowers) {
      queryObj.$or = [
        { "June_2023_Performance.instagram.followers_all_time": { $gte: minFollowers, $lte: maxFollowers } },
        { "June_2023_Performance.youtube.followers_all_time": { $gte: minFollowers, $lte: maxFollowers } }
      ];
    }
    let totalItems = await creatorV2.count(queryObj);
    console.log("Query Obj", queryObj);
    let data = await creatorV2.find(queryObj).sort({ risingStarPreference: 1, "June_2023_Performance.instagram.followers_all_time": -1, "June_2023_Performance.youtube.followers_all_time": -1 }).skip(offset).limit(limit);
    console.log("this is the data", data);
    let pushFinalData = [];
    let getFinalData = data.forEach((item) => {
      console.log("This is the content genre", item);
      let itemBody = {
        _id: item._id || "",
        brands: item.brands || [],
        creatorName: item.creator_name || "",
        profileURL: item.Tubular_Profile_URL || "",
        location: item.location || "",
        thumbnail: item.thumbnail ? item.thumbnail : "",
        // averageMonthlyPerformance: getCreatorData.monthly_performance || {},
        animetaVerified: item.animetaVerified || false,
        Content_Genre: item.Content_Genre || "",
        instadeal: item.instadeal ? item.instadeal : "",
        risingStarPreference: item.risingStarPreference ? item.risingStarPreference : 0,
        rising_star_platform: item.rising_star_platform ? item.rising_star_platform : "",
        rising_star: item.rising_star ? item.rising_star : false,
        animetaCreatorId: item.animetaCreatorId ? item.animetaCreatorId : "",
        platform: {
          facebook: {
            monthly_performance: {
              total_followers: item.Facebook_Current_All_Time_Page_Likes ? item.Facebook_Current_All_Time_Page_Likes : 0,
              views: item.May_2023_Facebook_Views ? item.May_2023_Facebook_Views : 0,
              views_growth_yoy: item.May_2023_Facebook_Views_Growth ? item.May_2023_Facebook_Views_Growth : 0,
              engagements: item.May_2023_Facebook_Engagements ? item.May_2023_Facebook_Engagements : 0,
              engagements_growth_yoy: item.May_2023_Facebook_Engagements_Growth ? item.May_2023_Facebook_Engagements_Growth : 0,
              average_engagement: item.May_2023_Facebook_E30 ? item.May_2023_Facebook_E30 : 0,
              average_views: item.May_2023_Facebook_V30 ? item.May_2023_Facebook_V30 : 0,
            }
          },
          youtube: {
            monthly_performance: {
              average_engagement: item.May_2023_YT_E30 ? item.May_2023_YT_E30 : 0,
              average_views: item.May_2023_YT_V30 ? item.May_2023_YT_V30 : 0,
              views: item.May_2023_YT_Views ? item.May_2023_YT_Views : 0,
              engagements: item.May_2023_YT_Engagements ? item.May_2023_YT_Engagements : 0,
              views_growth_yoy: item.May_2023_YT_Views_Growth ? item.May_2023_YT_Views_Growth : 0,
              engagements_growth_yoy: item.May_2023_YT_Engagements_Growth ? item.May_2023_YT_Engagements_Growth : 0,
              total_followers: item.YT_Current_All_Time_Subscribers ? item.YT_Current_All_Time_Subscribers : 0,
              views_growth_yoy: item.May_2023_YT_Views_Growth ? item.May_2023_YT_Views_Growth : 0,
            }
          },
          instagram: {
            monthly_performance: {
              average_engagement: item.May_2023_Instagram_E30 ? item.May_2023_Instagram_E30 : 0,
              average_views: item.May_2023_Instagram_V30 ? item.May_2023_Instagram_V30 : 0,
              total_followers: item.Instagram_Current_All_Time_Followers ? item.Instagram_Current_All_Time_Followers : 0,
              views_growth_yoy: item.Instagram_30_days_Followers_Growth ? item.Instagram_30_days_Followers_Growth : 0,
              engagements: item.May_2023_Instagram_Engagements ? item.May_2023_Instagram_Engagements : 0,
            }
          }
        }
      };
      pushFinalData.push(itemBody);
    });
    let finalData = getPagingData(pushFinalData, page, size, totalItems);
    if (finalData.length === 0) {
      return {
        code: statusCodes.HTTP_OK,
        data: null,
        message: "Operation completed Successfully",
      };
    }
    return {
      code: statusCodes.HTTP_OK,
      data: finalData,
      message: "Data Fetched Successfully",
      totalItems,
    };
  } catch (err) {
    throw err;
  }
};


CreatorService.updateRisingStarData = async (query) => {
  try {
    let risingStarData = JSON.parse(fs.readFileSync(path.join(__dirname, 'risingStar-pref-1.json')));
    let finalData = [];
    risingStarData.forEach(async (item) => {
      item.risingStarPreference = 3;
      item.rising_star_platform = "Youtube";
      item.rising_star = true;
      console.log("Processing the following creator ->", item.creator_name);
      finalData.push(item);
    });
    setTimeout(async () => {
      await fs.writeFileSync(path.join(__dirname, 'rising-star-1-1.json'), JSON.stringify(finalData));
    }, 30000);
    return {
      code: statusCodes.HTTP_OK,
      data: null,
      message: "Operation completed Successfully"
    }
  } catch (err) {
    throw new Error(err)
  }
}


// GET DATA FROM RISING STAR FOR CREATORS
CreatorService.getRisingStar = async (query) => {
  try {
    return await risingStar.findOne(query, { rising_star: 1 })
  } catch (err) {
    throw new Error(err)
  }
}

CreatorService.getRisingStarCreatorId = async () => {
  try {

    //* Do not delete the code , Logic used to make Tubular Profile URL
    let getCompleteRisingStarData = await risingStar.find({ creator_id: { $exists: true } });
    let updatedCount = 0;
    for (let data of getCompleteRisingStarData) {
      let findCreator = await creatorV2.findOne({ creator_id: data.creator_id });
      if (findCreator) {
        let updateData = await creatorV2.updateOne({ creator_id: data.creator_id }, { $set: { rising_star: true } });
        console.log("Updated the following creator", data.creator_id);
        updatedCount++;
      } else {
        console.log("Creator not found", data.creator_id);
      }
    }

    //* Do not delete the code , Logic used to update Thumbnail and Description
    // let getCompleteRisingStarData = await fs.readFileSync(path.join(__dirname, 'Rising-Star-4-494.json'));
    // getCompleteRisingStarData = JSON.parse(getCompleteRisingStarData);
    // getCompleteRisingStarData = getCompleteRisingStarData.creators;
    // console.log("getCompleteRisingStarData", getCompleteRisingStarData.length);
    // let updatedCount = 0;
    // for(let data of getCompleteRisingStarData){
    //   let updateData = await risingStar.updateOne({ creator_id: data.creator_id }, { $set: { thumbnail: data.thumbnail, description: data.description } });
    //   console.log("Updated the following creator", data.title, data.thumbnail);
    //   updatedCount++;
    // }

    //* Code to update the instagramData from Modash to CreatorV2
    // const getFirst1000Data = await creatorV2.find({ Instagram_handle: { $exists: true }, modashThumbnail: { $exists: false}}).sort({ "June_2023_Performance.instagram.monthly_performance.followers": -1 });\
    // let batchSize = 1000;
    // let bulkUpdateOps = [];
    // for (let data of getFirst1000Data) {
    //   console.log("Processing the following creator", data.Instagram_handle);
    //   const jsonFilePath = `E:/Workspace/ad-reports/ad-reports/${data.Instagram_handle}.json`;
    //   const findCreator = await readJSONFile(jsonFilePath);

    //   if (findCreator) {
    //     const updateData = {
    //       "June_2023_Performance.instagram.monthly_performance.followers": findCreator.profile.profile.followers,
    //       "June_2023_Performance.instagram.monthly_performance.engagements": findCreator.profile.profile.engagements,
    //       "June_2023_Performance.instagram.monthly_performance.average_views": findCreator.profile.avgReelsPlays,
    //       "location": findCreator.profile.city,
    //       "modashThumbnail": findCreator.profile.profile.picture,
    //     };
    //     if (!data.June_2023_Performance?.instagram?.monthly_performance?.tcr) {
    //       // Only set the nested 'er' field if the parent 'tcr' field does not exist
    //       updateData["June_2023_Performance.instagram.monthly_performance.tcr"] = { er: findCreator.profile.profile.engagementRate || null };
    //     }

    //     bulkUpdateOps.push({
    //       updateOne: {
    //         filter: { Instagram_handle: data.Instagram_handle },
    //         update: {
    //           $set: updateData,
    //         },
    //       },
    //     });

    //     if (bulkUpdateOps.length >= batchSize) {
    //       await creatorV2.bulkWrite(bulkUpdateOps, { ordered: false });
    //       bulkUpdateOps = [];
    //     }
    //   } else {
    //     console.log("No data found for the following creator", data.Instagram_handle);
    //   }
    // }

    // // Process any remaining data in the last batch
    // if (bulkUpdateOps.length > 0) {
    //   await creatorV2.bulkWrite(bulkUpdateOps, { ordered: false });
    // }
    // console.log("Total updated count", updatedCount);
    return {
      code: statusCodes.HTTP_OK,
      data: null,
      message: "Operation completed Successfully"
    }
  } catch (err) {
    throw new Error(err);
  }
}

CreatorService.addRisingStarCreators = async () => {
  try {
    let risingStarData = JSON.parse(fs.readFileSync(path.join(__dirname, 'Rising_Star_Response_3.json')));
    risingStarData = risingStarData.creators;
    console.log("risingStarData", risingStarData.length);
    let updateCount = 0;
    for (let data of risingStarData) {
      let findCreator = await risingStar.findOne({ creator_id: data.creator_id });
      if (!findCreator) {
        let creatorData = {
          creator_id: data.creator_id,
          creator_name: data.title,
          description: data.description,
          thumbnail: data.thumbnail,
          rising_star: data.rising_star,
          creator_type: data.creator_type,
          Content_Genre: data["genre"].title,
          accounts: data.accounts,
          Instagram_gid: data["accounts"]?.instagram?.gid || null,
          YT_gid: data["accounts"]?.youtube?.gid || null,
          Facebook_gid: data["accounts"]?.facebook?.gid || null,
          June_2023_Performance: {
            instagram: data["accounts"]?.instagram?.monthly_performance || null,
            youtube: data["accounts"]?.youtube?.monthly_performance || null,
            facebook: data["accounts"]?.facebook?.monthly_performance || null,
          }
        }
        let insertData = await risingStar.create(creatorData);
        console.log("Inserted the following creator", data.title);
        updateCount++;
      } else {
        console.log("Creator already exists", data.title);
        let updateData = await creatorV2.updateOne({ creator_id: data.creator_id }, { $set: { rising_star: true } });
      }
    }
    return {
      code: statusCodes.HTTP_OK,
      data: updateCount,
      message: "Operation completed Successfully"
    }
  } catch (err) {
    throw new Error(err);
  }
}

CreatorService.updateRisingStarCreatorId = async () => {
  try {
    // let findRisingStarCreators = await creatorV2.find({ rising_star: true});
    // console.log("findRisingStarCreators", findRisingStarCreators.length);
    // let updateCount = 0;
    // let nonUpdatedCreators = [];
    // for(let data of findRisingStarCreators){
    //   let findCreator = await risingStar.findOne({ creator_id: data.creator_id });
    //   if(findCreator){
    //     let updateData = await risingStar.updateOne({ creator_id: data.creator_id }, { $set: { animetaCreatorId: findCreator._id } });
    //     console.log("Updated the following creator", data.creator_id);
    //     updateCount++;
    //   } else {
    //     console.log("Creator not found", data.creator_id);
    //     // let deleteCreators = await risingStar.deleteOne({ creator_id: data.creator_id });
    //     nonUpdatedCreators.push(data.creator_id);
    //     // updateCount++;
    //   }
    // }
    // console.log("Non updated creators list", nonUpdatedCreators);
    // let checkRisingStarCreators = await fs.readFileSync(path.join(__dirname, 'nonUpdatedCreators.json'));
    let checkRisingStarCreators = await risingStar.find({});
    console.log("checkRisingStarCreators", checkRisingStarCreators.length);
    let nonUpdatedCreators = [];
    for (let data of checkRisingStarCreators) {
      let findCreator = await creatorV2.findOne({ creator_id: data.creator_id });
      if (!findCreator) {
        console.log("Creator not found", data.creator_id);
        nonUpdatedCreators.push(data.creator_id);
      } else {
        console.log("Creator found", data.creator_id);
        let updateRisingStarInfo = await risingStar.updateOne({ creator_id: data.creator_id }, { $set: { animetaCreatorId: `${findCreator._id}` } });
      }
    }
    return {
      code: statusCodes.HTTP_OK,
      data: nonUpdatedCreators,
      message: "Operation completed Successfully"
    }
  } catch (err) {
    throw new Error(err);
  }
}

CreatorService.getAndWriteVideoIdToExcel = async () => {
  try {
    const inputFilePath = path.resolve(__dirname, 'Music-&-Dance-Data-2765-907.json');
    const outputFilePath = path.resolve(__dirname, 'Modified-Music-&-Dance-Data-2765-907.json');

    const getCompleteData = fs.readFileSync(inputFilePath, 'utf-8');
    const parsedData = JSON.parse(getCompleteData);

    if (!parsedData.trends) {
      throw new Error("Invalid JSON format: 'trends' property not found");
    }

    const trendsData = parsedData.trends;
    console.log("Number of trends:", trendsData.length);

    const finalData = trendsData.map(dataItem => {
      return {
        id: dataItem.id,
        platform: dataItem.platform
      };
    });

    const writeData = JSON.stringify(finalData, null, 2);
    fs.writeFileSync(outputFilePath, writeData);

    return {
      code: statusCodes.HTTP_OK,
      data: null,
      message: "Operation completed successfully"
    };
  } catch (err) {
    throw new Error(err);
  }
};

CreatorService.getTubularVideoDetails = async () => {
  try {
    let readFileAndProcess = await fs.readFileSync(path.join(__dirname, 'People And Blogs.json'));
    readFileAndProcess = JSON.parse(readFileAndProcess);
    console.log("readFileAndProcess", readFileAndProcess.length);
    let getFinalResponseWritten = await TubularController.getTubularVideoDetails(readFileAndProcess);
    return {
      code: statusCodes.HTTP_OK,
      data: getFinalResponseWritten,
      message: "Operation completed Successfully"
    }
  } catch (err) {
    throw new Error(err);
  }
}

CreatorService.createExcelFromJson = async () => {
  try {
    let readFileAndProcess = await fs.readFileSync(path.join(__dirname, 'finalResponse-Video-data.json'));
    let writeDataToExcel = await pushDataToExcel(readFileAndProcess, "finalSheet", "finalSheet.xlsx");
    return {
      code: statusCodes.HTTP_OK,
      data: readFileAndProcess,
      message: "Operation completed Successfully"
    }
  } catch (err) {
    throw new Error(err);
  }
}

CreatorService.getVideoDataId = async () => {
  try {
    let getVideoData = await TubularController.getTubularVideoIds();
    return {
      code: statusCodes.HTTP_OK,
      data: getVideoData,
      message: "Operation completed Successfully"
    }
  } catch (err) {
    throw new Error(err);
  }
}

CreatorService.updateVideoJsonInfo = async () => {
  try {
    let getVideoData = await fs.readFileSync(path.join(__dirname, 'Entertainment.json'));
    getVideoData = JSON.parse(getVideoData);
    console.log("getVideoData", getVideoData.length);
    let finalResponse = [];
    const uniqueValues = new Set();
    const extractKey = 'id';
    for (let data of getVideoData) {
      console.log("Processing the following video id", data);
      // for(let innerData of data){
      //   console.log("Processing the following video id 2", data);
      //   if(innerData.points){
      //     console.log("Updating this video id", data.id);
      //     delete innerData.points;
      //   }
      //   finalResponse.push(innerData);
      // }
      // data.forEach(item => {
      //   console.log("Processing the following video id 2", item);
      //   if(item.points){
      //     console.log("Updating this video id", item.id);
      //     delete item.points;
      //   }
      //   finalResponse.push(item);
      // });
      finalResponse.push(data.id);
    }
    // const uniqueObjectsMap = getVideoData.reduce((map, obj) => {
    //   if (extractKey in obj) {
    //       map.set(obj[extractKey], obj);
    //   }
    //   return map;
    // }, new Map()); 
    // const uniqueObjectsArray = Array.from(uniqueObjectsMap.values());
    await fs.writeFileSync(path.join(__dirname, 'Entertainment.json'), JSON.stringify(finalResponse));
    return {
      code: statusCodes.HTTP_OK,
      data: getVideoData,
      message: "Operation completed Successfully"
    }
  } catch (err) {
    throw new Error(err);
  }
}

CreatorService.uploadLatestYTData = async () => {
  try {
    //* Code to clean the data received from Tubular
    // const filePath = path.join(__dirname, 'final-YT-Creator-Data-155K-200K.json');
    // const rawData = fs.readFileSync(filePath, 'utf8');
    // const getLatestYTData = JSON.parse(rawData);
    //
    // if (!Array.isArray(getLatestYTData)) {
    //   throw new Error("Invalid data format: getLatestYTData should be an array");
    // }
    //
    // let processData = [];
    // for (let data of getLatestYTData) {
    //   if (!data.creators || !Array.isArray(data.creators)) {
    //     console.log("Invalid data format: data.creators should be an array");
    //     continue;
    //   }
    //
    //   for (let item of data.creators) {
    //     console.log(item);
    //     processData.push(item);
    //   }
    // }
    //
    // console.log("Processed data length:", processData.length);
    // await fs.writeFileSync("YT-Data-155K-200K-Processed.json", JSON.stringify(processData));
    // let getCompleteData = await fs.readFileSync(path.join(__dirname, 'YT-Data-200K-500K-Processed.json'));
    // getCompleteData = JSON.parse(getCompleteData);
    // console.log("getCompleteData", getCompleteData.length);
    // let existingCreators = []
    // for (let data of getCompleteData) {
    //   let findCreator = await creatorV2.findOne({ creator_id: data.creator_id });
    //   console.log("")
    //   if(findCreator){
    //     console.log("Creator Already Exists", data.creator_id);
    //     existingCreators.push(data.creator_id);
    //   } else {
    //     let creatorBody = {
    //       creator_name: data.title,
    //       YT_gid: data.accounts.youtube.gid,
    //       accounts: data.accounts,
    //       June_2023_Performance: {
    //         youtube: data.accounts.youtube ? data.accounts.youtube.monthly_performance : null,
    //         facebook: data.accounts.facebook ? data.accounts.facebook.monthly_performance : null,
    //         instagram: data.accounts.instagram ? data.accounts.instagram.monthly_performance : null,
    //       },
    //       Content_Genre: data["genre"].title,
    //       thumbnail: data.thumbnail,
    //       description: data.description,
    //       creator_id: data.creator_id,
    //       language: data.language,
    //       type: data.type,
    //       country: data.country,
    //       themes: data.themes
    //     }
    //     let insertCreator = await creatorV2.create(creatorBody);
    //     console.log("Inserted the following creator", data.creator_id);
    //   }
    // }
    let getCompleteData = await creatorV2.find({
      "June_2023_Performance.youtube.monthly_performance.followers_all_time": { $exists: false }
    });
    let updateCount = 0;
    for (let data of getCompleteData) {
      if (data.June_2023_Performance) {
        const updateFields = {};

        if (data.June_2023_Performance.youtube) {
          updateFields["June_2023_Performance.youtube.monthly_performance"] =
            data.June_2023_Performance.youtube;
        }

        // if (data.June_2023_Performance.facebook) {
        //   updateFields["June_2023_Performance.facebook.monthly_performance"] =
        //       data.June_2023_Performance.facebook;
        // } else {
        //   updateFields["June_2023_Performance.facebook.monthly_performance"] = null;
        // }

        // if (data.June_2023_Performance.instagram) {
        //   updateFields["June_2023_Performance.instagram.monthly_performance"] =
        //       data.June_2023_Performance.instagram;
        // } else {
        //   updateFields["June_2023_Performance.instagram.monthly_performance"] = null;
        // }


        let updateData = await creatorV2.updateMany(
          { creator_id: data.creator_id },
          { $set: { "June_2023_Performance.youtube.monthly_performance": data.June_2023_Performance.youtube } }
        );

        console.log("Updated the following creator", data.creator_id);
        updateCount++;
      }
    }

    return {
      code: statusCodes.HTTP_OK,
      data: updateCount,
      message: "Operation completed Successfully"
    };
  } catch (err) {
    throw new Error(err);
  }
}

CreatorService.uploadUAECreators = async () => {
  try {
    let readUAECreatorData = await fs.readFileSync(path.join(__dirname, 'UAE-Creators-Data.json'));
    readUAECreatorData = JSON.parse(readUAECreatorData);
    console.log("readUAECreatorData", readUAECreatorData.length);
    let updatedCount = [];
    for (let data of readUAECreatorData) {
      let dataBody = {
        creator_name: data.creator_name,
        YT_Title: data?.YT_Title || null,
        YT_id: data?.YT_id || null,
        Facebook_Username: data?.Facebook_Username || null,
        Tiktok_Username: data?.Tiktok_Username,
        AdWords_Placement: data["AdWords Placement"] || null,
        country: data?.country || null,
        Content_Genre: data["Content Genre"] || null,
        themes: data?.themes || null,
        YT_Category: data?.YT_Category || null,
        Facebook_Category: data?.Facebook_Category || null,
        Tiktok_URL: data?.Tiktok_URL,
        Tubular_Profile_URL: data?.Tubular_Profile_URL || null,
        June_2023_Performance: {
          youtube: {
            monthly_performance: {
              views_all_time: data?.YT_Current_All_Time_Views || null,
              followers_all_time: data?.YT_Current_All_Time_Subscribers || null,
              followers: data["30d_Facebook_Followers"] || null,
              engagements: data?.Jul_2023_YT_Engagements || null,
              engagements_all_time: data?.YT_Current_All_Time_Engagements || null,
              engagements_growth_yoy: data?.Jul_2023_YT_Engagements_Growth || null,
              followers_growth_yoy: data?.Jul_2023_YT_Subscribers_Growth || null,
              tcr: {
                er: data?.Jul_2023_YouTube_ER30 || null,
                v30: data?.Jul_2023_YouTube_V30 || null,
                e30: data?.Jul_2023_YouTube_E30 || null,
              }
            }
          },
          instagram: {
            monthly_performance: {
              views_all_time: data?.IG_Current_All_Time_Views || null,
              followers_all_time: data?.IG_Current_All_Time_Followers || null,
              followers: data["30d_Facebook_Followers"] || null,
              engagements: data?.Jul_2023_IG_Engagements || null,
              engagements_all_time: data?.IG_Current_All_Time_Engagements || null,
              engagements_growth_yoy: data?.Jul_2023_IG_Engagements_Growth || null,
              followers_growth_yoy: data?.Jul_2023_IG_followers_Growth || null,
              tcr: {
                er: data?.Jul_2023_Instagram_ER30 || null,
                v30: data?.Jul_2023_Instagram_V30 || null,
                e30: data?.Jul_2023_Instagram_E30 || null,
              }
            }
          },
          facebook: {
            monthly_performance: {
              views_all_time: data?.Facebook_Current_All_Time_Views || null,
              followers_all_time: data?.Facebook_Current_All_Time_Page_Likes || null,
              followers: data["30d_Facebook_Followers"] || null,
              engagements: data?.Jul_2023_FB_Engagements || null,
              engagements_all_time: data?.FB_Current_All_Time_Engagements || null,
              engagements_growth_yoy: data?.Jul_2023_FB_Engagements_Growth || null,
              followers_growth_yoy: data?.Jul_2023_FB_Followers_Growth || null,
              tcr: {
                er: data?.Jul_2023_Facebook_ER30 || null,
                v30: data?.Jul_2023_Facebook_V30 || null,
                e30: data?.Jul_2023_Facebook_E30 || null,
              }
            }
          },
          YT_gid: data?.YT_gid || null,
          Facebook_gid: data?.Facebook_gid || null,
          TikTok_gid: data?.TikTok_gid || null,
          Facebook_category: data?.Facebook_category || null,
        }
      }
      let createCreator = await creatorV2.create(dataBody)
      console.log("Inserted the following creator", data.creator_name)
    }
    return {
      code: statusCodes.HTTP_OK,
      data: updatedCount,
      mesasge: "UAE Creators Data inserted Successfully."
    }
  } catch (err) {
    throw new Error(err);
  }
}

CreatorService.getRisingStarMax = async () => {
  try {
    return await creatorV2.aggregate([
      {
        $match: { rising_star: true }
      },
      {
        $project: {
          _id: 0,
          max_followers: {
            $max: [
              "$June_2023_Performance.facebook.monthly_performance.followers_all_time",
              "$June_2023_Performance.instagram.monthly_performance.followers_all_time",
              "$June_2023_Performance.youtube.monthly_performance.followers_all_time"
            ]
          }
        }
      },
      {
        $sort: {
          max_followers: -1
        }
      },
      {
        $limit: 1
      }
    ]);
  } catch (err) {
    throw new Error(err);
  }



}



CreatorService.getRisingStarMin = async () => {
  try {
    return await creatorV2.aggregate([
      {
        $match: {
          rising_star: true
        }
      },
      {
        $project: {
          _id: 0,
          min_followers: {
            $min: [
              { $ifNull: ["$June_2023_Performance.facebook.monthly_performance.followers_all_time", Number.MAX_VALUE] },
              { $ifNull: ["$June_2023_Performance.instagram.monthly_performance.followers_all_time", Number.MAX_VALUE] },
              { $ifNull: ["$June_2023_Performance.youtube.monthly_performance.followers_all_time", Number.MAX_VALUE] }
            ]
          }
        }
      },
      {
        $sort: {
          min_followers: 1
        }
      },
      {
        $limit: 1
      }
    ]);
  } catch (err) {
    throw new Error(err);
  }
}
module.exports = CreatorService;