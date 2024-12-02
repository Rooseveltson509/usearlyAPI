//require("dotenv").config();
import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from 'url';
import fs from 'fs';
//import fs from "fs/promises";
import path from 'path';
// Gestion des chemins pour les fichiers
const loadSwaggerDocument = async () => {
  const data = await fs.readFile("./config/swagger.json", "utf-8");
  return JSON.parse(data);
};

// Résolution des chemins pour ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger config.json
const configPath = path.resolve(__dirname, './config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

console.log("Config chargé avec succès :", config);



dotenv.config();
import bodyParser from "body-parser";
import apiRouter from "./apiRouter.js";

import cors from "cors";
import {func} from "./funcs/functions.js";
//import {corsOptions} from "./funcs/functions.js";
//import config from "./config/config.json";
//const configPath = path.resolve(__dirname, '../config/config.json');

// Charger la configuration en fonction de l'environnement
/* let config = {};
try {
  const jsonConfig = JSON.parse(fs.readFileSync(configPath));
  config = jsonConfig[env] || {};
} catch (error) {
  console.error('Erreur lors du chargement de config.json :', error);
  process.exit(1); // Quitte si le fichier de config n'est pas valide
} */
import promBundle from "express-prom-bundle";

//var express = require("express");
//const swaggerUi = require("swagger-ui-express");
const swaggerPath = path.resolve('./config/swagger.json');
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'));

/* var bodyParser = require("body-parser");
let apiRouter = require("./apiRouter").router;
let cors = require("cors");
const corsOptions = require("./funcs/functions");
let config = require("./config/config");
const promBundle = require("express-prom-bundle"); */

//const swaggerJSDoc = require("swagger-jsdoc");


// Instanciate server
const server = express();

//const swaggerDocument = await loadSwaggerDocument();

// Global middleware for CORS in index.js
server.use(cors(func.corsOptionsDelegate));
server.options('*', cors(func.corsOptionsDelegate));

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

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// launch server
server.listen(config.port, function () {
  console.log("Server en écoute sur le port : ", config.port);
  console.log(`API disponible à : http://localhost:${config.port}${config.rootAPI}`);
});
