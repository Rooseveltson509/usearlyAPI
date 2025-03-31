"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Suggestions", "siteUrl", {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "", // ✅ Valeur temporaire pour éviter les erreurs
  });

  await queryInterface.addColumn("Suggestions", "emoji", {
    type: Sequelize.STRING,
    allowNull: true, // ✅ Peut être null au début
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("Suggestions", "siteUrl");
  await queryInterface.removeColumn("Suggestions", "emoji");
}
