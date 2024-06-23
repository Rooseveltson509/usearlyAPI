require("dotenv").config();
var express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./config/swagger.json");
var bodyParser = require("body-parser");
let apiRouter = require("./apiRouter").router;
let cors = require("cors");
const corsOptions = require("./funcs/functions");
let config = require("./config/config");
const promBundle = require("express-prom-bundle");
require("./models/index")

// Instanciate server
var server = express();

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

// Configure routes
server.get(config.rootAPI, function (req, res) {
  res.setHeader("Content-Type", "text/html");
  res.status(200).send("<h1>Welcom to the ApiRestFull server</h1>");
});

server.use(config.rootAPI, apiRouter);
//let apiRouter = express.Router();

// launch server
server.listen(config.port, function () {
  console.log("Server en écoute on port: " + config.port +  " - "+ process.env.NODE_ENV);
});
