import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import csurf from "csurf";
import cookieParser from "cookie-parser"; // ✅ Importation de `cookie-parser`
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

// ✅ Ajout du middleware `cookie-parser`
server.use(cookieParser()); // ✅ Permet de lire les cookies envoyés dans les requêtes

const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  },
});

server.use(csrfProtection);

// Ajouter un endpoint pour récupérer le token CSRF dans le front
server.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// CORS Configuration
server.use(cors(func.corsOptionsDelegate));
server.options("*", cors(func.corsOptionsDelegate));

// Servir les fichiers statiques
server.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Body Parser configuration
server.use(express.json());
server.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
server.use(bodyParser.json({ limit: "10mb" }));

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

// ✅ Vérification du chargement des routes
try {
  server.use(config.rootAPI, apiRouter);
} catch (err) {
  console.error("Erreur lors du chargement des routes :", err);
}

// Gestion des erreurs globales
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.stack);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

// Lancement du serveur
server.listen(PORT, "0.0.0.0", function () {
  console.log("Server en écoute sur le port : ", PORT);
  console.log("ENV MODE:", process.env.NODE_ENV);
  console.log(`API disponible à : http://localhost:${PORT}${config.rootAPI}`);
});
