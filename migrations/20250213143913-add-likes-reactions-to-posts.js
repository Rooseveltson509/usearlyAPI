"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Posts", "reactions", {
    type: Sequelize.JSON, // JSON est spécifique à PostgreSQL, utilise JSON pour MySQL
    allowNull: false,
    defaultValue: "[]",
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("Posts", "reactions");
}
