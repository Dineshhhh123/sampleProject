"use strict";

module.exports = function (env) {
  const LOCAL_CONSTANTS = {
    PORT: process.env.PORT,
    MONGO_URL: process.env.MONGO_URL,
    NODE_ENV: process.env.NODE_ENV,
    DB_CHOICE: process.env.DB_CHOICE,
  };

  const TEST_CONSTANTS = {
    PORT: process.env.PORT,
    MONGO_URL: process.env.MONGO_TEST_URL,
    NODE_ENV: process.env.NODE_ENV,
    DB_CHOICE: process.env.DB_CHOICE,
  };

  const DEV_CONSTANTS = {
    PORT: process.env.PORT,
    MONGO_URL: process.env.MONGO_URL,
    NODE_ENV: process.env.NODE_ENV,
    DB_CHOICE: process.env.DB_CHOICE,
  };

  const PROD_CONSTANTS = {
    PORT: process.env.PORT,
    MONGO_URL: process.env.MONGO_URL,
    NODE_ENV: process.env.NODE_ENV,
    DB_CHOICE: process.env.DB_CHOICE,
  };
  let envType;

  switch (env) {
    case "DEV":
      envType = DEV_CONSTANTS;
      break;

    case "LOCAL":
      envType = LOCAL_CONSTANTS;
      break;

    case "QA":
      envType = TEST_CONSTANTS;
      break;

    case "PROD":
      envType = PROD_CONSTANTS;
      break;

    default:
      envType = { NA: "NA" };
      break;
  }

  return envType;
};
