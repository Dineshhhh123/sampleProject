const { adCategories } = require("../../database/mongo/models");

class AdCategoryService {}

AdCategoryService.getAll = async () => {
  try {
    return await adCategories.find();
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = AdCategoryService;
