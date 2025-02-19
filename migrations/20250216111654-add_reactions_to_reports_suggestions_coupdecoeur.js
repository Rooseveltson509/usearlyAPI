"use strict";
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Reportings", "reactions", {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: [],
  });

  await queryInterface.addColumn("Suggestions", "reactions", {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: [],
  });

  await queryInterface.addColumn("CoupDeCoeurs", "reactions", {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: [],
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("Reportings", "reactions");
  await queryInterface.removeColumn("Suggestions", "reactions");
  await queryInterface.removeColumn("CoupDeCoeurs", "reactions");
}
