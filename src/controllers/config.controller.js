const { statusCodes, messages } = require("../configs");
const { response } = require("../middleware");
const { configService, creatorService } = require("../services/mongo");

class ConfigController {}

ConfigController.getConfig = async (req, res, next) => {
  const { configName } = req?.params;
  try {
    let result;
    result = await configService.getConfig(configName);
    if (!result) {
      return response.errors(
        req,
        res,
        statusCodes.HTTP_INTERNAL_SERVER_ERROR,
        undefined,
        messages["500"]
      );
    }
    let newResult = {};
    result.map((x) => (newResult[x.configName] = x.configList));
    return response.success(req, res, statusCodes.HTTP_OK, newResult);
  } catch (err) {
    next(err);
  }
};

ConfigController.getConfigWithCondition = async (req, res, next) => {
  const { configs } = req.body;
  try {
    const result = await configService.getConfigWithCondition(configs);
    if (!result) {
      return response.errors(
        req,
        res,
        statusCodes.HTTP_NOT_FOUND,
        undefined,
        messages["404"]
      );
    }
   
    return response.success(req, res, statusCodes.HTTP_OK, result);
  } catch (err) {
    console.log(err)
    next(err);
  }
};
module.exports = ConfigController;
