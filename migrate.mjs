import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Sequelize
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: console.log,
});

// Vérifiez Sequelize
console.log('Sequelize module:', Sequelize);
console.log('Sequelize instance created successfully');

// Configure Umzug
const umzug = new Umzug({
    migrations: {
      glob: path.join(__dirname, 'migrations/*.js'),
      resolve: ({ name, path, context }) => {
        return {
          name,
          up: async () => {
            const migration = await import(path); // Importer la migration
            if (typeof migration.up !== 'function') {
              throw new Error(`Migration ${name} does not export an "up" function`);
            }
            return migration.up(context, Sequelize);
          },
          down: async () => {
            const migration = await import(path); // Importer la migration
            if (typeof migration.down !== 'function') {
              throw new Error(`Migration ${name} does not export a "down" function`);
            }
            return migration.down(context, Sequelize);
          },
        };
      },
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });
  

(async () => {
  try {
    console.log('Starting migrations...');
    await umzug.up();
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Error running migrations:', error);
  } finally {
    await sequelize.close();
  }
})();
