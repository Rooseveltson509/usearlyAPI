'use strict';

/* const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};


// Utilisation des variables d'environnement
const database = process.env.DB_NAME || config.database;
const username = process.env.DB_USER || config.username;
const password = process.env.DB_PASSWORD || config.password;
const host = process.env.DB_HOST || config.host;
const dialect = process.env.DB_DIALECT || config.dialect || 'mysql';

let sequelize; */
/* if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
} */

/*   sequelize = new Sequelize("usearly_db","usearly_dbname", "Mireille@509", {
    host: "db4free.net",
    dialect: "mysql",
    dialectModule: require('mysql2'),
  }); */

/*   sequelize.authenticate().then(() => {
    console.log("test env: "+ env);
    console.log("Connected successfully");
  }).catch(err => {
    console.log("Error: "+ err);
  }) */
/* try { */
  // Initialisation de Sequelize avec des options de configuration
/*   sequelize = new Sequelize(database, username, password, {
    host: host,
    dialect: dialect,
    dialectModule: require('mysql2'), // Utilisation de mysql2 pour MySQL
    logging: false, // Désactiver les logs de requêtes SQL pour plus de clarté
    pool: {
      max: 5, // Nombre maximum de connexions dans le pool
      min: 0, // Nombre minimum de connexions dans le pool
      acquire: 30000, // Temps maximum, en millisecondes, que le pool essaiera d'obtenir une connexion avant de générer une erreur
      idle: 10000 // Temps maximum, en millisecondes, qu'une connexion peut rester inactive avant d'être libérée
    }
  }); */

  // Authentification de la connexion
/*   sequelize.authenticate().then(() => {
    console.log("Environment: " + env);
    console.log("Database connected successfully");
  }).catch(err => {
    console.error("Unable to connect to the database:", err);
  });
} catch (err) {
  console.error("Error setting up the database connection:", err);
} */

// Charger tous les modèles
/* fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  }); */

// Associer les modèles s'il y a des associations définies
/* Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db; */

import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize'; // Import Sequelize directement
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
// Chargement des variables d'environnement
dotenv.config();

import config from "../config/config.js"; // Importez le fichier JS de configuration



// Gestion des chemins pour les fichiers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Déterminer l'environnement (development, test, production)
const env = process.env.NODE_ENV || 'development';
//const configPath = path.resolve(__dirname, '../config/config.json');

try {
  const dbConfig = config[env];
  if (!dbConfig) {
    throw new Error(`Configuration non trouvée pour l'environnement : ${env}`);
  }
  console.log("Configuration chargée avec succès :", dbConfig);
} catch (error) {
  console.error("Erreur lors du chargement de la configuration :", error);
  process.exit(1); // Quitter l'application si la configuration échoue
}

// Charger la configuration en fonction de l'environnement
/* let config = {};
try {
  const jsonConfig = JSON.parse(fs.readFileSync(configPath));
  config = jsonConfig[env] || {};
} catch (error) {
  console.error('Erreur lors du chargement de config.json :', error);
  process.exit(1); // Quitte si le fichier de config n'est pas valide
} */

// Configuration de la base de données avec fallback aux variables d'environnement
const database = process.env.DB_NAME || config.database;
const username = process.env.DB_USER || config.username;
const password = process.env.DB_PASSWORD || config.password;
const host = process.env.DB_HOST || config.host;
const dialect = process.env.DB_DIALECT || config.dialect || 'mysql';

// Initialisation de Sequelize
let sequelize;
try {
  sequelize = new Sequelize(database, username, password, {
    host,
    dialect,
    dialectModule: (await import('mysql2')).default,
    logging: env === 'development', // Active les logs en mode développement
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });

  // Vérification de la connexion
  await sequelize.authenticate();
  console.log(`Environnement : ${env}`);
  console.log('Connexion à la base de données réussie !');
} catch (error) {
  console.error('Erreur de connexion à la base de données :', error);
  process.exit(1); // Quitte si la connexion échoue
}

// Chargement des modèles
const db = {};
const modelsDirectory = fs
  .readdirSync(__dirname)
  .filter((file) => file.indexOf('.') !== 0 && file !== path.basename(__filename) && file.endsWith('.js'));

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

// Export des instances et de Sequelize
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;