'use strict';

const fs = require('fs');
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

let sequelize;
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
try {
  // Initialisation de Sequelize avec des options de configuration
  sequelize = new Sequelize(database, username, password, {
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
  });

  // Authentification de la connexion
  sequelize.authenticate().then(() => {
    console.log("Environment: " + env);
    console.log("Database connected successfully");
  }).catch(err => {
    console.error("Unable to connect to the database:", err);
  });
} catch (err) {
  console.error("Error setting up the database connection:", err);
}

// Charger tous les modèles
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Associer les modèles s'il y a des associations définies
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;