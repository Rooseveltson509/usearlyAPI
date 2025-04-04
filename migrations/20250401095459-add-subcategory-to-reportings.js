"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Reportings", "subCategory", {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("Reportings", "subCategory");
}
