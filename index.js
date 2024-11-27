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
const swaggerJSDoc = require("swagger-jsdoc");


// Instanciate server
var server = express();

// server.use(cors());
//server.use(cors(corsOptions.corsOptionsDelegate));

// Body Parser configuration
server.use(bodyParser.urlencoded({ extended: true, limit: '10mb' })); // Augmente la limite des requêtes URL-encoded
server.use(bodyParser.json({ limit: '10mb' })); // Augmente la limite des requêtes JSON

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
  res.status(200).send("<h1>Welcom to Usearly ApiRestFull.</h1>");
});

server.use(config.rootAPI, apiRouter);
//let apiRouter = express.Router();

// Middleware global pour gérer les erreurs CORS des requêtes OPTIONS
server.options("*", cors(corsOptions.corsOptionsDelegate));

// launch server
server.listen(config.port, function () {
  console.log("Server en écoute... ");
});
