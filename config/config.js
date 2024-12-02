import path from 'path'; // Assurez-vous d'importer 'path'
import { fileURLToPath } from 'url'; // Importez fileURLToPath pour travailler avec ES Modules
import dotenv from 'dotenv'; // Charger les variables d'environnement

dotenv.config(); // Charger le fichier .env

// Configuration pour utiliser __dirname avec ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  development: {
    username: process.env.DB_USER || "default_user",
    password: process.env.DB_PASSWORD || "default_password",
    database: process.env.DB_NAME || "default_database",
    host: process.env.DB_HOST || "localhost",
    dialect: process.env.DB_DIALECT || "mysql",
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'SequelizeMeta',
  },
  test: {
    username: process.env.DB_USER || "default_user",
    password: process.env.DB_PASSWORD || "default_password",
    database: process.env.DB_NAME || "default_database",
    host: process.env.DB_HOST || "localhost",
    dialect: process.env.DB_DIALECT || "mysql",
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'SequelizeMeta',
  },
  production: {
    username: process.env.DB_USER || "default_user",
    password: process.env.DB_PASSWORD || "default_password",
    database: process.env.DB_NAME || "default_database",
    host: process.env.DB_HOST || "localhost",
    dialect: process.env.DB_DIALECT || "mysql",
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'SequelizeMeta',
  },
};
