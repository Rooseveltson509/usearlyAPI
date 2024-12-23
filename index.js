//require("dotenv").config();
import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import fs from "fs";
import rateLimit from "express-rate-limit";
import path from "path";
dotenv.config();
import bodyParser from "body-parser";
import apiRouter from "./apiRouter.js";
// PromBundle pour monitoring des métriques
import promBundle from "express-prom-bundle";
import cors from "cors";
import { func } from "./funcs/functions.js";

// Résolution des chemins pour ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger config.json
const configPath = path.resolve(__dirname, "./config/config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
// Servir les fichiers statiques depuis le dossier public

// Configuration du rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Fenêtre de 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  message:
    "Trop de requêtes provenant de cette IP. Veuillez réessayer plus tard.",
});

//const swaggerUi = require("swagger-ui-express");
const swaggerPath = path.resolve("./config/swagger.json");
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf-8"));
// Instanciate server
const server = express();

//const swaggerDocument = await loadSwaggerDocument();

server.use(
  "/tesseract",
  express.static(path.join(__dirname, "public/tesseract"))
);
server.get(
  "/list-tesseract-files",
  limiter, // Appliquer la limitation sur cette route
  (req, res) => {
    const files = fs.readdirSync(path.join(__dirname, "public/tesseract"));
    res.json(files);
  }
);
// Global middleware for CORS in index.js
server.use(cors(func.corsOptionsDelegate));
server.options("*", cors(func.corsOptionsDelegate));

// Body Parser configuration
server.use(bodyParser.urlencoded({ extended: true, limit: "10mb" })); // Augmente la limite des requêtes URL-encoded
server.use(bodyParser.json({ limit: "10mb" })); // Augmente la limite des requêtes JSON

server.use(
  config.rootAPI + "api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
});
server.use(metricsMiddleware);

// Configure routes
server.get(config.rootAPI, function (req, res) {
  res.setHeader("Content-Type", "text/html");
  res.status(200).send("<h1>Welcom to Usearly ApiRestFull.</h1>");
});

server.use(config.rootAPI, apiRouter);
//let apiRouter = express.Router();

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.stack);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

// launch server
server.listen(config.port, function () {
  console.log("Server en écoute sur le port : ", config.port);
  console.log(
    `API disponible à : http://localhost:${config.port}${config.rootAPI}`
  );
});
