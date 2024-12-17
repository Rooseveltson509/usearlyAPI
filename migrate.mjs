import { Sequelize } from "sequelize";
import { Umzug, SequelizeStorage } from "umzug";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql",
    logging: console.log, // Affiche les logs SQL
  }
);

// Configure Umzug
const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, "migrations/*.js"),
    resolve: ({ name, path, context }) => ({
      name,
      up: async () => {
        const migration = await import(path); // Charger dynamiquement la migration
        if (typeof migration.up !== "function") {
          throw new Error(
            `La migration ${name} n'exporte pas une fonction "up".`
          );
        }
        return migration.up(context, Sequelize);
      },
      down: async () => {
        const migration = await import(path); // Charger dynamiquement la migration
        if (typeof migration.down !== "function") {
          throw new Error(
            `La migration ${name} n'exporte pas une fonction "down".`
          );
        }
        return migration.down(context, Sequelize);
      },
    }),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

// Exécuter les commandes selon l'entrée utilisateur
const run = async () => {
  const command = process.argv[2]; // Récupérer la commande (up, down, reset)

  try {
    console.log(`Commande reçue : ${command}`);
    if (command === "up") {
      await umzug.up();
      console.log("Toutes les migrations ont été appliquées avec succès.");
    } else if (command === "down") {
      await umzug.down();
      console.log("La dernière migration a été annulée avec succès.");
    } else if (command === "reset") {
      await umzug.down({ to: 0 });
      console.log("Toutes les migrations ont été annulées.");
    } else {
      console.error("Commande inconnue. Utilisez 'up', 'down' ou 'reset'.");
    }
  } catch (error) {
    console.error("Erreur lors de l'exécution des migrations :", error);
  } finally {
    await sequelize.close();
    console.log("Connexion Sequelize fermée.");
  }
};

run();
