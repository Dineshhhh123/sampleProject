require('dotenv').config();
const cluster = require('cluster');
const v8 = require('v8');
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const app = express();


if (cluster.isMaster) {
  const worker = cluster.fork();
  cluster.on('exit', (deadWorker, code, signal) => {
    console.log(`Worker ${deadWorker.process.pid} died.`);
    const newWorker = cluster.fork();
    console.log(`Worker ${newWorker.process.pid} born.`);
  });
} else { // worker
  const totalHeapSizeThreshold = v8.getHeapStatistics().heap_size_limit * 0.85;

  const detectHeapOverflow = () => {
    const stats = v8.getHeapStatistics();
    if (stats.total_heap_size > totalHeapSizeThreshold) {
      process.exit();
    }
  };
  setInterval(detectHeapOverflow, 1000);

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
  });

  app.use(require("morgan")("dev", {
    skip: (req, res) => res.statusCode > 500
  }));

  // CustomLogger implementation
  const { CustomLogger } = require("./src/middleware/logger");
  const appLogger = new CustomLogger();
  app.use(appLogger.requestDetails(appLogger));

  const { DB_CHOICE } = require('./src/configs/thirdpartyConfig');

  const { handler } = require("./src/middleware/errorHandler");

  const routers = require("./src/routes");

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "success", message: "Running successfully" });
  });
  routers(app);

  app.use(handler);

  const port = process.env.PORT || 3200;

  let dbConn;
  switch (DB_CHOICE) {
    case "MONGO":
      dbConn = require("./src/database/mongo/db.config");
      break;
    default:
      throw new Error("Database Type not defined");
  }
  dbConn()
    .then(() => {
      app.listen(port, () => console.log(`App listening at port ${port}`));
    })
    .catch(console.error);
}

module.exports = app;