import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import cookieParser from "cookie-parser"; // ✅ Nécessaire pour CSRF
import csurf from "csurf"; // ✅ Importation du middleware CSRF
dotenv.config();
import bodyParser from "body-parser";
import apiRouter from "./apiRouter.js";
import promBundle from "express-prom-bundle";
import cors from "cors";
import { func } from "./funcs/functions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, "./config/config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const PORT = process.env.PORT || config.port;

const swaggerPath = path.resolve("./config/swagger.json");
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf-8"));

const server = express();

// ✅ CORS doit être placé en premier
server.use(cors(func.corsOptionsDelegate));
server.options("*", cors(func.corsOptionsDelegate));

// ✅ Cookie Parser doit être ajouté avant `csurf`
server.use(cookieParser());

// ✅ Middleware CSRF Protection
const csrfProtection = csurf({
  cookie: {
    httpOnly: true, // 🔒 Sécurise contre XSS
    secure: process.env.NODE_ENV === "production", // ✅ Actif uniquement en production
    sameSite: "Strict", // ✅ Empêche les attaques CSRF intersites
  },
});

// ✅ Appliquer CSRF Protection AVANT les routes API
server.use(csrfProtection);

// ✅ Endpoint pour récupérer le CSRF Token
server.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() }); // ✅ Correctif ici !
});

// ✅ Middleware de parsing JSON (Important après `cookieParser`)
server.use(express.json());
server.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
server.use(bodyParser.json({ limit: "10mb" }));

// ✅ Swagger
server.use(
  config.rootAPI + "api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

// ✅ Middleware Prometheus pour monitoring
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
});
server.use(metricsMiddleware);

// ✅ Chargement de l'API Router APRÈS CSRF
server.use(config.rootAPI, apiRouter);

// ✅ Gestion des erreurs globales
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.stack);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

// ✅ Lancement du serveur
server.listen(PORT, "0.0.0.0", function () {
  console.log("✅ Server en écoute sur le port : ", PORT);
  console.log("✅ ENV MODE:", process.env.NODE_ENV);
  console.log(
    `✅ API disponible à : http://localhost:${PORT}${config.rootAPI}`
  );
});
