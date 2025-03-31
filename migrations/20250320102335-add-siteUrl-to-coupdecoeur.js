"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("CoupDeCoeurs", "siteUrl", {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "", // ✅ Valeur temporaire pour éviter les erreurs
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("CoupDeCoeurs", "siteUrl");
}
