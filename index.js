import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import cookieParser from "cookie-parser"; // ✅ Correctement placé avant csurf
//import bodyParser from "body-parser";
import promBundle from "express-prom-bundle";
import cors from "cors";
import { func } from "./funcs/functions.js";
import apiRouter from "./apiRouter.js"; // ✅ Routes API

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, "./config/config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const PORT = process.env.PORT || config.port;

const swaggerPath = path.resolve("./config/swagger.json");
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf-8"));

const server = express();

// ✅ 1. Configuration CORS
server.use(cors(func.corsOptionsDelegate));
server.options("*", cors(func.corsOptionsDelegate));

// ✅ 2. Cookies & Body Parser
server.use(cookieParser());
server.use(express.json({ limit: "50mb" }));
server.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ 3. Autoriser l'accès aux images (évite CSRF sur /uploads)
server.use("/uploads", express.static(path.join(__dirname, "uploads")));
server.use((req, res, next) => {
  if (req.path.startsWith("/uploads/")) {
    return next();
  }
  next();
});

// ✅ 5. Swagger Documentation
server.use(
  config.rootAPI + "api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

// ✅ 6. Middleware Prometheus pour monitoring
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
});
server.use(metricsMiddleware);

// ✅ 7. Routes API (doit être après le CSRF middleware)
server.use(config.rootAPI, apiRouter);
// ✅ Middleware de gestion des erreurs Multer (fichiers non autorisés)
server.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_TYPE") {
    return res
      .status(400)
      .json({ error: "⚠️ Format non autorisé. Utilisez JPG, PNG ou WEBP." });
  }
  next(err);
});

// ✅ 8. Gestion des erreurs globales
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.stack);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

// ✅ 9. Lancement du serveur
server.listen(PORT, "0.0.0.0", function () {
  console.log("✅ Server en écoute sur le port :", PORT);
  console.log("✅ ENV MODE:", process.env.NODE_ENV);
  console.log(
    `✅ API disponible à : http://localhost:${PORT}${config.rootAPI}`
  );
});
