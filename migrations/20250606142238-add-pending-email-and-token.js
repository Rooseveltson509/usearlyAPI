"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Users", "pendingEmail", {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn("Users", "emailChangeToken", {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("Users", "pendingEmail");
  await queryInterface.removeColumn("Users", "emailChangeToken");
}