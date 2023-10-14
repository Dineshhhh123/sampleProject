const { config } = require("../../database/mongo/models");

class ConfigService {}

ConfigService.getConfig = async (configName) => {
  try {
    let query;
    if (configName.toLowerCase() == "all") {
      query = {};
    } else {
      query = {
        configName,
      };
    }
    return await config.find(query);
  } catch (err) {
    throw new Error(err);
  }
};


ConfigService.getConfigWithCondition = async (configs) => {
  try {
    if(configs.length == 0){
      return await config.find({}, {_id:0});
    }else{
      return await config.find({ configName: { $in: configs }}, {_id:0});
    }
   
  } catch (err) {
    throw new Error(err);
  }
};
module.exports = ConfigService;
