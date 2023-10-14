const userService = require("./user.service");
const creatorService = require("./creator.service");
const creatorOnboardingService = require("./creatorOnboarding.service");
const brandService = require("./brand.service");
const adCategoryService = require("./adCategories.service");
const campaignService = require("./campaign.service");
const configService = require("./config.service");
const shortListService = require("./shortListCreators.service");
const videosService = require("./videos.service");
const campMgmtService = require("./campManagement.service")
const deliverableService= require("./deliverable.service")
module.exports = {
  userService,
  creatorService,
  creatorOnboardingService,
  brandService,
  adCategoryService,
  campaignService,
  configService,
  shortListService,
  videosService,
  campMgmtService,
  deliverableService
};
