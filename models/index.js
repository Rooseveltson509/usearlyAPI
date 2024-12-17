"use strict";
import fs from "fs";
import path from "path";
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import config from "../config/config.js";

dotenv.config();

// Utilisation de __dirname avec ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Détecte l'environnement
const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

let sequelize;
try {
  sequelize = new Sequelize({
    ...dbConfig,
    dialectModule:
      env === "test" ? undefined : (await import("mysql2")).default,
  });

  await sequelize.authenticate();
  console.log(`Environnement : ${env}`);
  console.log("Connexion à la base de données réussie !");
} catch (error) {
  console.error("Erreur de connexion à la base de données :", error);
  process.exit(1);
}

// Chargement des modèles
const db = {};
const modelsDirectory = fs
  .readdirSync(__dirname)
  .filter(
    (file) =>
      file.indexOf(".") !== 0 &&
      file !== path.basename(__filename) &&
      file.endsWith(".js")
  );

for (const file of modelsDirectory) {
  const { default: defineModel } = await import(path.join(__dirname, file));
  const model = defineModel(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

// Gestion des associations
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
