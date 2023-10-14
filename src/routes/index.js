const initializeRoutes = (app) => {
  app.use("/api/v1/user", require("./v1/user.routes"));
  app.use("/api/v1/config", require("./v1/config.routes"));
};

module.exports = initializeRoutes;
