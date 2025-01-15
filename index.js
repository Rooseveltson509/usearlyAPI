//require("dotenv").config();
import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import fs from "fs";
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
const PORT = process.env.PORT || config.port; // Valeur par défaut pour l'environnement local

//const swaggerUi = require("swagger-ui-express");
const swaggerPath = path.resolve("./config/swagger.json");
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf-8"));
// Instanciate server
const server = express();

// Global middleware for CORS in index.js
server.use(cors(func.corsOptionsDelegate));
server.options("*", cors(func.corsOptionsDelegate));

// Configurez un chemin public pour servir les fichiers statiques
server.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

try {
  server.use(config.rootAPI, apiRouter);
} catch (err) {
  console.error("Erreur lors du chargement des routes :", err);
}
//let apiRouter = express.Router();

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.stack);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

// launch server
server.listen(PORT, "0.0.0.0", function () {
  console.log("Server en écoute sur le port : ", PORT);
  console.log(`API disponible à : http://localhost:${PORT}${config.rootAPI}`);
});
