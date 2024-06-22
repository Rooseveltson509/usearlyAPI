require("dotenv").config();
var express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./config/swagger.json");
//const expressOasGenerator = require('express-oas-generator');
var bodyParser = require("body-parser");
let apiRouter = require("./apiRouter").router;
let cors = require("cors");
const corsOptions = require("./funcs/functions");
let config = require("./config/config");
// // // // const apiMetrics = require('prometheus-api-metrics');
// // import promBundle from 'express-prom-bundle';
// // import createMetricsPlugin from 'apollo-metrics';
const promBundle = require("express-prom-bundle");

// Instanciate server
var server = express();
//expressOasGenerator.init(server, {}); // to overwrite generated specification's values use second argument.

// server.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
//   next();
// });

// server.use(cors());
server.use(cors(corsOptions.corsOptionsDelegate));

// Body Parser configuration
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(
  config.rootAPI + "api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

const metricsMiddleware = promBundle({includeMethod: true, includePath: true});
server.use(metricsMiddleware);
// // // // server.use(apiMetrics());
// // server.get('/metrics', async (_, res) => {
// //   const metrics = await getAggregateMetrics();
// //   res.set('Content-Type', aggregatorRegistry.contentType);
// //   res.send(metrics.metrics());
// // });
// // const apolloMetricsPlugin = createMetricsPlugin(register);
// metrics for rest requests
// //server.use(
// //    promBundle({
// //        autoregister: false, // disable /metrics for single workers
// //        includeMethod: true,
// //        includeStatusCode: true,
// //        includePath: true,
// //        promRegistry: register,
// //    }),
// //);

// Configure routes
server.get(config.rootAPI, function (req, res) {
  res.setHeader("Content-Type", "text/html");
  res.status(200).send("<h1>Welcom to the ApiRestFull server</h1>");
});

server.use(config.rootAPI, apiRouter);
//let apiRouter = express.Router();

// launch server
server.listen(config.port, function () {
  console.log("Server en écoute on port: " + config.port);
});
