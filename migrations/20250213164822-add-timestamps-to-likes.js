"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Likes", "updatedAt", {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("Likes", "updatedAt");
}
