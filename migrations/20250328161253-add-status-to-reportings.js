"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Reportings", "status", {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "pending", // Valeur par défaut à "pending"
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("Reportings", "status");
}
