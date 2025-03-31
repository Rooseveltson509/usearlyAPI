"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Reportings", "domain", {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "", // ✅ Évite les erreurs SQL lors de la migration
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("Reportings", "domain");
}
