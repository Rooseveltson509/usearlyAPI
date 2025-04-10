import db from "../models/index.js";

const { sequelize, ...models } = db;

async function clearDatabase() {
  try {
    console.log("🧹 Vidage de la base...");

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const name of Object.keys(models)) {
      const model = models[name];
      if (model?.destroy) {
        await model.destroy({ where: {}, force: true });
        console.log(`✔ Table "${name}" vidée`);
      }
    }

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("✅ Base nettoyée !");
  } catch (err) {
    console.error("❌ Erreur :", err);
  } finally {
    await sequelize.close();
  }
}

clearDatabase();
